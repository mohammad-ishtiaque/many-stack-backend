const express = require('express');
const router = express.Router();
const { createExpense, getAllExpenses, getExpenseById, updateExpense, deleteExpense, downloadSingleExpensePDF } = require('../controllers/Expense.controller');
const upload = require('../utils/Upload');
const { auth } = require('../middleware/auth');
const downloadAsPDF = require('../utils/downloadpdf');


router.post('/create', upload.array('images'),auth,  createExpense);
router.get('/get-all', auth,getAllExpenses);
router.get('/get-by-one/:id', auth,getExpenseById);
router.put('/update/:id', auth,upload.array('images'),updateExpense);
router.delete('/delete/:id', auth,deleteExpense);
router.get('/download-pdf/:id', auth, downloadSingleExpensePDF);


module.exports = router;
