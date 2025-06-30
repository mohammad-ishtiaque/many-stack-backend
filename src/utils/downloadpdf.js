const PDFDocument = require('pdfkit');

exports.generateInvoicePDF = (invoice, res) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoice.invoiceId}.pdf`);
    doc.pipe(res);

    // === Header ===
    doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('INVOICE', 0, 30, { align: 'center' })
        .moveDown(50);

    doc
        .image(`uploads/${invoice.user.businessLogo}`, 50, 45, { width: 100 })
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`${invoice.invoiceId}`, 400, 50, { align: 'right' })
        .moveDown(30)


    doc.text(`Date: ${new Date(invoice.data).toLocaleDateString()}`, 400, 70, { align: 'right' });
    doc.moveDown(2);

    // === Customer Info ===
    const { streetNo, streetName, city, postalCode, country } = invoice.address;
    doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Customer Information', { underline: true })
        .moveDown(0.5)
        .font('Helvetica')
        .fontSize(10)
        .text(`Name     : ${invoice.name}`)
        .text(`Email    : ${invoice.email}`)
        .text(`Phone    : ${invoice.phone}`)
        .text(`SIREN    : ${invoice.nSiren}`)
        .text(`Address  : ${streetNo} ${streetName}, ${postalCode} ${city}, ${country}`);

    doc.moveDown(1.5);

    // === Services Table Header ===
    const tableTop = doc.y;
    doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('No.', 50, tableTop)
        .text('Service', 100, tableTop)
        .text('Qty', 320, tableTop, { width: 50, align: 'right' })
        .text('Price', 400, tableTop, { width: 100, align: 'right' });

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
        .text(`Status: ${invoice.status}`, 400, y + 30, { width: 100, align: 'right' });

    // === Images Section ===
    // if (invoice.images && invoice.images.length > 0) {
    //     doc
    //         .font('Helvetica-Bold')
    //         .fontSize(14)
    //         .text('Images:', { underline: true })
    //         .moveDown(1);

    //     const imagesPerRow = 2;
    //     const imageWidth = 200;
    //     const imageHeight = 150;
    //     const margin = 50;
    //     const captionHeight = 35;
    //     let startY = doc.y;

    //     for (let i = 0; i < invoice.images.length; i += imagesPerRow) {
    //         let rowY = startY;
    //         // Draw images in the row
    //         for (let j = 0; j < imagesPerRow; j++) {
    //             const index = i + j;
    //             if (index >= invoice.images.length) break;
    //             const image = invoice.images[index];
    //             const x = margin + (j * (imageWidth + 50));
    //             try {
    //                 doc.image(image.url, x, rowY, {
    //                     width: imageWidth,
    //                     height: imageHeight,
    //                     fit: [imageWidth, imageHeight]
    //                 });
    //             } catch (error) {
    //                 doc.font('Helvetica').fontSize(10).text('Image failed to load', x, rowY);
    //             }
    //         }
    //         // Draw captions below each image
    //         for (let j = 0; j < imagesPerRow; j++) {
    //             const index = i + j;
    //             if (index >= invoice.images.length) break;
    //             const image = invoice.images[index];
    //             const x = margin + (j * (imageWidth + 50));
    //             const captionY = rowY + imageHeight + 5;
    //             doc.font('Helvetica').fontSize(10)
    //                 .text(`Image ${index + 1}: ${image.location || 'Unknown Location'}`, x, captionY, { width: imageWidth })
    //                 .text(`${new Date(image.createdAt).toLocaleDateString()}`, x, captionY + 15, { width: imageWidth });
    //         }
    //         // Move Y for next row
    //         startY = rowY + imageHeight + captionHeight + 20;
    //         if (startY > doc.page.height - 100) {
    //             doc.addPage();
    //             startY = doc.y;
    //         }
    //     }
    // }

    doc.end();
};



exports.generateInterventionPDF = (intervention, res) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=intervention_${intervention.interventionId}.pdf`);
    doc.pipe(res);

    // === Header ===
    doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('INTERVENTION REPORT', { align: 'center' })
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
        .text(`Category`, { continued: true })
        .text(`     : ${intervention.category?.name || 'N/A'}`, { align: 'right' })
        .moveDown(0.5)
        .text(`Price`, { continued: true })
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
        .text(`STATUS: ${intervention.status}`, { align: 'right' });

    // Reset fill color to black for the rest of the document!
    doc.fillColor('black');

    // === Images Section ===
    if (intervention.images && intervention.images.length > 0) {
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
                    doc.image(image.url, x, rowY, {
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

    doc.end();
};


exports.generateExpensePDF = (expense, res) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=expense_${expense._id}.pdf`);
    doc.pipe(res);

    // === Header ===
    doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('EXPENSE REPORT', { align: 'center' })
        .moveDown(2);

    doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`Expense ID: ${expense._id}`, { bold: true })
        .moveDown(1);

    doc.moveDown(1);
    // === Basic Details ===
    doc
        .font('Helvetica')
        .fontSize(14)
        .text(`Date`, { continued: true })
        .text(`         : ${new Date(expense.createdAt).toLocaleString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'right' })
        .moveDown(0.5)
        .text(`Expense Name`, { continued: true })
        .text(` : ${expense.expenseName || 'N/A'}`, { align: 'right' })
        .moveDown(0.5)
        .text(`Category`, { continued: true })
        .text(`     : ${expense.expenseCategory || 'N/A'}`, { align: 'right' })
        .moveDown(0.5)
        .text(`Price`, { continued: true })
        .text(`       : ${expense.price.toFixed(2)} $`, { align: 'right' })
        .moveDown(0.5)
        .text(`Note`, { continued: true })
        .text(`        : ${expense.note || '-'}`, { align: 'right' })
        .moveDown(1);

    // === Images Section ===
    if (expense.images && expense.images.length > 0) {
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
                    doc.image(image.url, x, rowY, {
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

    doc.end();
};



// .image(`uploads/${invoice.user.businessLogo}`, 50, 45, { width: 100 })

