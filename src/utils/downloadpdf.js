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

    // === Header - FACTURE Title ===
    doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('FACTURE', 400, 30, { align: 'right' });

    // === Business Information (Top Right) ===
    const businessY = 80;
    doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(invoice.user?.firstName && invoice.user?.lastName ? 
            `${invoice.user.firstName} ${invoice.user.lastName}` : 
            'Nom de l\'entreprise', 400, businessY, { align: 'right' })
        .fontSize(10)
        .font('Helvetica')
        .text(invoice.user?.address?.streetNo && invoice.user?.address?.streetName ? 
            `${invoice.user.address.streetNo} ${invoice.user.address.streetName}` : 
            'Adresse de l\'entreprise', 400, businessY + 18, { align: 'right' })
        .text(invoice.user?.address?.city && invoice.user?.address?.postalCode ? 
            `${invoice.user.address.postalCode} ${invoice.user.address.city}` : 
            'Ville, Code postal', 400, businessY + 36, { align: 'right' })
        .text(invoice.user?.address?.country || 'France', 400, businessY + 54, { align: 'right' })
        .text(`n° SIREN: ${invoice.user?.nSiren || 'XXXXXXXXXXXXXXX'}`, 400, businessY + 72, { align: 'right' })
        .text(invoice.user?.email || 'email@example.com', 400, businessY + 90, { align: 'right' });

    // === Invoice Details (Top Right) ===
    const invoiceDetailsY = businessY + 120;
    doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`Facture N°: ${invoice.invoiceId}`, 350, invoiceDetailsY, { align: 'right' })
        .fontSize(10)
        .font('Helvetica')
        .text(`Date d'émission: ${new Date(invoice.date || invoice.data).toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}`, 350, invoiceDetailsY + 20, { align: 'right' })
        .text(`Date d'échéance: ${new Date(new Date(invoice.date || invoice.data).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        })}`, 350, invoiceDetailsY + 40, { align: 'right' });

    // === Customer Information (Top Left) ===
    const customerY = 80;
    doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Facturé à', 50, customerY)
        .fontSize(10)
        .font('Helvetica')
        .text(invoice.name, 50, customerY + 25)
        .text(`${invoice.address.streetNo} ${invoice.address.streetName}`, 50, customerY + 45)
        .text(`${invoice.address.postalCode} ${invoice.address.city}`, 50, customerY + 65)
        .text(invoice.address.country, 50, customerY + 85)
        .text(`n° SIREN: ${invoice.nSiren}`, 50, customerY + 105);

    // === Services Table ===
    // Calculate table position to avoid overlap
    const businessSectionHeight = 200; // Business info + invoice details
    const customerSectionHeight = 150; // Customer info
    const tableTop = Math.max(customerY + customerSectionHeight, businessY + businessSectionHeight);
    
    // Table header with blue background
    doc
        .rect(50, tableTop, 500, 25)
        .fill('#4A90E2')
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('white')
        .text('DESCRIPTION', 60, tableTop + 8)
        .text('QUANTITÉ', 300, tableTop + 8)
        .text('PRIX (€)', 380, tableTop + 8)
        .text('MONTANT (€)', 460, tableTop + 8);

    // Reset fill color to black
    doc.fillColor('black');

    // Table rows
    let total = 0;
    let y = tableTop + 30;

    invoice.services.forEach((item, index) => {
        // Alternate row background
        if (index % 2 === 0) {
            doc.rect(50, y - 5, 500, 20).fill('#F8F9FA');
        }
        
        doc
            .font('Helvetica')
            .fontSize(10)
            .fillColor('black')
            .text(item.selectedService, 60, y, { width: 200 })
            .text(item.quantity.toString(), 300, y)
            .text(item.price.toFixed(2).replace('.', ','), 380, y)
            .text((item.price * item.quantity).toFixed(2).replace('.', ','), 460, y);

        total += item.price * item.quantity;
        y += 25; // Increased spacing between rows
    });

    // Bottom border
    doc.moveTo(50, y).lineTo(550, y).stroke();

    // === Totals Section ===
    const totalsY = y + 30; // More space after table
    doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`MONTANT TOTAL (EUR):`, 350, totalsY, { align: 'right' })
        .text(`${total.toFixed(2).replace('.', ',')} €`, 400, totalsY + 20, { align: 'right' });

    // Separator line
    doc.moveTo(400, totalsY + 40).lineTo(550, totalsY + 40).stroke();

    // Amount to pay
    doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('MONTANT À PAYER (EUR)', 350, totalsY + 55, { align: 'right' })
        .fontSize(16)
        .text(`${total.toFixed(2).replace('.', ',')} €`, 400, totalsY + 80, { align: 'right' });

    // === Status and Signature Section ===
    const statusY = totalsY + 120; // More space before status
    doc
        .fontSize(12)
        .fillColor(invoice.status === 'PAID' ? 'green' : 'red')
        .text(`Statut: ${invoice.status === 'PAID' ? 'PAYÉ' : 'NON PAYÉ'}`, 50, statusY);

    // === Signature Section ===
    doc
        .fillColor('black')
        .fontSize(10)
        .text('Signature:', 50, statusY + 30);

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
        const imageWidth = 150;
        const imageHeight = 100;
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
                    .text(`Image ${index + 1}: ${image?.location || 'Unknown Location'}`, x, captionY, { width: imageWidth })
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

