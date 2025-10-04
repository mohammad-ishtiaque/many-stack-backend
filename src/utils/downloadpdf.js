const PDFDocument = require('pdfkit');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Optional: sharp for WebP/SVG conversion if installed
let sharp = null;
try {
    sharp = require('sharp');
} catch (_) {
    // sharp not installed; skip conversion
}

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
});

function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

// Helper: Load image from URL (S3/public) as Buffer or fallback to local path
async function loadImageInput(src) {
    if (!src) return null;
    try {
        if (typeof src === 'string' && /^https?:\/\//i.test(src)) {
            // Try HTTP(S) fetch first
            try {
                const response = await axios.get(src, { responseType: 'arraybuffer', timeout: 10000 });
                let buf = Buffer.from(response.data);
                const ct = (response.headers['content-type'] || '').toLowerCase();
                if (sharp && (ct.includes('image/webp') || ct.includes('image/svg'))) {
                    // Convert to PNG for PDFKit compatibility
                    buf = await sharp(buf).png().toBuffer();
                }
                return buf;
            } catch (httpErr) {
                // If URL looks like S3 and request failed, attempt AWS SDK GetObject
                const m = src.match(/^https?:\/\/([^\/]+)\/(.+)$/i);
                if (m) {
                    const host = m[1];
                    const key = m[2];
                    // Try to infer bucket from host patterns like <bucket>.s3.*.amazonaws.com
                    let bucket = process.env.S3_BUCKET || process.env.AWS_BUCKET_NAME;
                    const sub = host.split('.')[0];
                    if (!bucket && /s3/i.test(host)) bucket = sub;
                    if (bucket) {
                        try {
                            const out = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: decodeURIComponent(key) }));
                            let buf = await streamToBuffer(out.Body);
                            const ct = (out.ContentType || '').toLowerCase();
                            if (sharp && (ct.includes('image/webp') || ct.includes('image/svg'))) {
                                buf = await sharp(buf).png().toBuffer();
                            }
                            return buf;
                        } catch (_) {
                            // fall through
                        }
                    }
                }
            }
        }
        // Treat as local path
        const absPath = path.isAbsolute(src) ? src : path.resolve(src);
        if (fs.existsSync(absPath)) {
            // If local .webp and sharp exists, convert
            if (sharp && /\.webp$/i.test(absPath)) {
                try {
                    const buf = await fs.promises.readFile(absPath);
                    return await sharp(buf).png().toBuffer();
                } catch (_) {}
            }
            return absPath;
        }
        // If src appears to be an S3 key, try fetching via SDK
        if (typeof src === 'string') {
            const bucket = process.env.S3_BUCKET || process.env.AWS_BUCKET_NAME;
            if (bucket) {
                try {
                    const out = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: src }));
                    let buf = await streamToBuffer(out.Body);
                    const ct = (out.ContentType || '').toLowerCase();
                    if (sharp && (ct.includes('image/webp') || ct.includes('image/svg'))) {
                        buf = await sharp(buf).png().toBuffer();
                    }
                    return buf;
                } catch (_) {}
            }
        }
        return null;
    } catch (e) {
        return null;
    }
}

exports.generateInvoicePDF = async (invoice, res) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice_${invoice.invoiceId}.pdf`);
    doc.pipe(res);
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    // === Header ===
    doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('FACTURE', 0, 30, { align: 'center' })
        .moveDown(50);

    // Try to render business logo from S3/public URL or local fallback
    try {
        const logoSrcCandidate = invoice?.user?.businessLogo;
        const localFallback = logoSrcCandidate && !/^https?:\/\//i.test(logoSrcCandidate)
            ? `uploads/${logoSrcCandidate}`
            : null;
        const logoInput = await loadImageInput(logoSrcCandidate || localFallback);
        if (logoInput) {
            doc.image(logoInput, 50, 45, { width: 100 });
        }
    } catch (_) {
        // ignore logo failures
    }

    doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`${invoice.invoiceId}`, 400, 50, { align: 'right' })
        .moveDown(30)


    doc.text(`Date: ${new Date(invoice.date || invoice.data).toLocaleDateString()}`, 400, 70, { align: 'right' });
    doc.moveDown(2);

    // === Customer Info ===
    const { streetNo, streetName, city, postalCode, country } = invoice.address;
    doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Informations du client', { underline: true })
        .moveDown(0.5)
        .font('Helvetica')
        .fontSize(10)
        .text(`Nom     : ${invoice.name}`)
        .text(`Email    : ${invoice.email}`)
        .text(`Téléphone    : ${invoice.phone}`)
        .text(`SIREN    : ${invoice.nSiren}`)
        .text(`Adresse  : ${streetNo} ${streetName}, ${postalCode} ${city}, ${country}`);

    doc.moveDown(1.5);

    // === Services Table Header ===
    const tableTop = doc.y;
    doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Numéro', 50, tableTop)
        .text('Service', 100, tableTop)
        .text('Quantité', 320, tableTop, { width: 50, align: 'right' })
        .text('Prix', 400, tableTop, { width: 100, align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // === Services Table Rows ===
    let total = 0;
    let y = tableTop + 25;

    invoice.services.forEach((item, index) => {
        doc
            .font('Helvetica')
            .fontSize(10)
            .text(`${index + 1}`, 50, y)
            .text(item.selectedService, 100, y)
            .text(item.quantity.toString(), 320, y, { width: 50, align: 'right' })
            .text(`${item.price.toFixed(2)} $`, 400, y, { width: 100, align: 'right' });

        total += item.price;
        y += 20;
    });

    doc.moveTo(50, y).lineTo(550, y).stroke();

    // === Total and Status ===
    doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(`Total: ${total.toFixed(2)} $`, 400, y + 10, { width: 100, align: 'right' });

    doc
        .fontSize(12)
        .fillColor(invoice.status === 'PAID' ? 'green' : 'red')
        .text(`Statut: ${invoice.status}`, 400, y + 30, { width: 100, align: 'right' });

    // Finalize when the stream is ready
    return new Promise((resolve, reject) => {
        doc.on('end', resolve);
        doc.on('error', reject);
        doc.end();
    });
};



exports.generateInterventionPDF = async (intervention, res) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=intervention_${intervention.interventionId}.pdf`);
    doc.pipe(res);
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    // === Header ===
    doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('RAPPORT D\'INTERVENTION', { align: 'center' })
        .moveDown(2);

    doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`${intervention.interventionId}`, { bold: true })
        .moveDown(1);

    doc.moveDown(1);
    // === Basic Details ===
    doc
        .font('Helvetica')
        .fontSize(14)
        .text(`Date`, { continued: true })
        .text(`         : ${new Date(intervention.createdAt).toLocaleString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'right' })
        .moveDown(0.5)
        .text(`Catégorie`, { continued: true })
        .text(`     : ${intervention.category?.name || 'N/A'}`, { align: 'right' })
        .moveDown(0.5)
        .text(`Prix`, { continued: true })
        .text(`       : ${intervention.price.toFixed(2)} $`, { align: 'right' })
        .moveDown(0.5)
        .text(`Note`, { continued: true })
        .text(`        : ${intervention.note || '-'}`, { align: 'right' })
        .moveDown(1);

    // === Status Highlight ===
    doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(intervention.status === 'PAID' ? 'green' : 'red')
        .text(`Statut: ${intervention.status}`, { align: 'right' });

    // Reset fill color to black for the rest of the document!
    doc.fillColor('black');

    // === Images Section ===
    if (intervention.images && intervention.images.length > 0) {
        // Preload images concurrently to reduce total wait time
        const preloadedImages = await Promise.all(
            intervention.images.map(img => loadImageInput(img.url || img.src || img.path))
        );
        doc
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('Images:', { underline: true })
            .moveDown(1);

        const imagesPerRow = 2;
        const imageWidth = 200;
        const imageHeight = 150;
        const margin = 50;
        const captionHeight = 35;
        let startY = doc.y;

        for (let i = 0; i < intervention.images.length; i += imagesPerRow) {
            let rowY = startY;
            // Draw images in the row
            for (let j = 0; j < imagesPerRow; j++) {
                const index = i + j;
                if (index >= intervention.images.length) break;
                const image = intervention.images[index];
                const x = margin + (j * (imageWidth + 50));
                try {
                    const imgInput = preloadedImages[index];
                    if (!imgInput) throw new Error('No image input');
                    doc.image(imgInput, x, rowY, {
                        width: imageWidth,
                        height: imageHeight,
                        fit: [imageWidth, imageHeight]
                    });
                } catch (error) {
                    doc.font('Helvetica').fontSize(10).text('Image failed to load', x, rowY);
                }
            }
            // Draw captions below each image, and measure height for date
            for (let j = 0; j < imagesPerRow; j++) {
                const index = i + j;
                if (index >= intervention.images.length) break;
                const image = intervention.images[index];
                const x = margin + (j * (imageWidth + 50));
                const captionY = rowY + imageHeight + 5;
                doc.font('Helvetica').fontSize(10);
                const captionText = `Image ${index + 1}: ${image.location || 'Unknown Location'}`;
                doc.text(captionText, x, captionY, { width: imageWidth, continued: false });
                const captionHeightActual = doc.heightOfString(captionText, { width: imageWidth });
                doc.text(
                    `${new Date(image.createdAt).toLocaleDateString()}`,
                    x,
                    captionY + captionHeightActual + 2,
                    { width: imageWidth, continued: false }
                );
            }
            // Move Y for next row
            startY = rowY + imageHeight + captionHeight + 20;
            if (startY > doc.page.height - 100) {
                doc.addPage();
                startY = doc.y;
            }
        }
    }

    return new Promise((resolve, reject) => {
        doc.on('end', resolve);
        doc.on('error', reject);
        doc.end();
    });
};


exports.generateExpensePDF = async (expense, res) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=expense_${expense._id}.pdf`);
    doc.pipe(res);
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    // === Header ===
    doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('RAPPORT DE DÉPENSES', { align: 'center' })
        .moveDown(2);

    doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`ID de la dépense: ${expense._id}`, { bold: true })
        .moveDown(1);

    doc.moveDown(1);
    // === Basic Details ===
    doc
        .font('Helvetica')
        .fontSize(14)
        .text(`Date`, { continued: true })
        .text(`         : ${new Date(expense.createdAt).toLocaleString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'right' })
        .moveDown(0.5)
        .text(`Nom de la dépense`, { continued: true })
        .text(` : ${expense.expenseName || 'N/A'}`, { align: 'right' })
        .moveDown(0.5)
        .text(`Catégorie`, { continued: true })
        .text(`     : ${expense.expenseCategory || 'N/A'}`, { align: 'right' })
        .moveDown(0.5)
        .text(`Prix`, { continued: true })
        .text(`       : ${expense.price.toFixed(2)} $`, { align: 'right' })
        .moveDown(0.5)
        .text(`Note`, { continued: true })
        .text(`        : ${expense.note || '-'}`, { align: 'right' })
        .moveDown(1);

    // === Images Section ===
    if (expense.images && expense.images.length > 0) {
        const preloadedImages = await Promise.all(
            expense.images.map(img => loadImageInput(img.url || img.src || img.path))
        );
        doc
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('Images:', { underline: true })
            .moveDown(1);

        const imagesPerRow = 2;
        const imageWidth = 200;
        const imageHeight = 150;
        const margin = 50;
        const captionHeight = 35; // Space for caption and date
        let startY = doc.y;

        for (let i = 0; i < expense.images.length; i += imagesPerRow) {
            let rowY = startY;
            // Draw images in the row
            for (let j = 0; j < imagesPerRow; j++) {
                const index = i + j;
                if (index >= expense.images.length) break;
                const image = expense.images[index];
                const x = margin + (j * (imageWidth + 50));
                try {
                    const imgInput = await loadImageInput(image.url || image.src || image.path);
                    if (!imgInput) throw new Error('No image input');
                    doc.image(imgInput, x, rowY, {
                        width: imageWidth,
                        height: imageHeight,
                        fit: [imageWidth, imageHeight]
                    });
                } catch (error) {
                    doc.font('Helvetica').fontSize(10).text('Image failed to load', x, rowY);
                }
            }
            // Draw captions below each image
            for (let j = 0; j < imagesPerRow; j++) {
                const index = i + j;
                if (index >= expense.images.length) break;
                const image = expense.images[index];
                const x = margin + (j * (imageWidth + 50));
                const captionY = rowY + imageHeight + 5;
                doc.font('Helvetica').fontSize(10)
                    .text(`Image ${index + 1}: ${image.location || 'Unknown Location'}`, x, captionY, { width: imageWidth })
                    .text(`${new Date(image.createdAt).toLocaleDateString()}`, x, captionY + 15, { width: imageWidth });
            }
            // Move Y for next row
            startY = rowY + imageHeight + captionHeight + 20;
            // Add new page if needed
            if (startY > doc.page.height - 100) {
                doc.addPage();
                startY = doc.y;
            }
        }
    }

    return new Promise((resolve, reject) => {
        doc.on('end', resolve);
        doc.on('error', reject);
        doc.end();
    });
};



// .image(`uploads/${invoice.user.businessLogo}`, 50, 45, { width: 100 })

