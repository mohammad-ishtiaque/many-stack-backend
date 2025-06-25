const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/Invoice.controller');
const { auth } = require('../middleware/auth');
const generatePdf = require('../utils/downloadpdf');

// Create new invoice
router.post('/create', auth, invoiceController.createInvoice);

// // Get all invoices
router.get('/get-all', auth, invoiceController.getAllInvoices);

// // Get invoice by ID
router.get('/get-by-id/:id', auth, invoiceController.getInvoiceById);

// // Update invoice
router.put('/update/:id', auth, invoiceController.updateInvoice);

// // Delete invoice
router.delete('/delete/:id', auth, invoiceController.deleteInvoice);

// // Download invoice as PDF
// router.get('/generate-pdf/:id', auth, invoiceController.createAndSaveInvoicePDF);

router.get('/download/:id', auth, invoiceController.downloadInvoice);

// // paid-unpaid invoice
router.put('/paid-unpaid/:id', auth, invoiceController.paidUnpaid);

module.exports = router; 