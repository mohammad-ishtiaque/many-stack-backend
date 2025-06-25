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

    doc.end();
};








// .image(`uploads/${invoice.user.businessLogo}`, 50, 45, { width: 100 })

