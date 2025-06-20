const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/Invoice.controller');
const { auth } = require('../middleware/auth');

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
router.get('/download-pdf/:id', auth, invoiceController.downloadSingleInvoicePDF);

module.exports = router; 