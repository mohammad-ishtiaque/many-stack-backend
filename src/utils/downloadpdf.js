const PDFDocument = require('pdfkit');

function singleDocToPDF({ docData, fields = [], labels = [], filename = 'expense.pdf', res, title = 'Expense Details' }) {
    try {
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);

        // Title
        doc.fontSize(18).text(title, { align: 'center' }).moveDown();

        // Details
        doc.fontSize(12).font('Helvetica');
        fields.forEach((field, idx) => {
            let value = field.split('.').reduce((o, k) => (o ? o[k] : ''), docData);
            if (value instanceof Date) value = value.toISOString().split('T')[0];
            doc.text(`${labels[idx] || field}: ${value !== undefined ? value : ''}`);
        });

        doc.end();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = singleDocToPDF;