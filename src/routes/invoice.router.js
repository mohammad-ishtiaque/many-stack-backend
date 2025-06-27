const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/Invoice.controller');
const { userAuth } = require('../middleware/auth');
const generatePdf = require('../utils/downloadpdf');

// Create new invoice
router.post('/create', userAuth, invoiceController.createInvoice);

// // Get all invoices
router.get('/get-all', userAuth, invoiceController.getAllInvoices);

// // Get invoice by ID
router.get('/get-by-id/:id', userAuth, invoiceController.getInvoiceById);

// // Update invoice
router.put('/update/:id', userAuth, invoiceController.updateInvoice);

// // Delete invoice
router.delete('/delete/:id', userAuth, invoiceController.deleteInvoice);

// // Download invoice as PDF
// router.get('/generate-pdf/:id', userAuth, invoiceController.createAndSaveInvoicePDF);

router.get('/download/:id', userAuth, invoiceController.downloadInvoice);

// // paid-unpaid invoice
router.put('/paid-unpaid/:id', userAuth, invoiceController.paidUnpaid);

module.exports = router; 