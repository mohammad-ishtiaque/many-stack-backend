const express = require('express');
const router = express.Router();
const { createExpense, getAllExpenses, getExpenseById, updateExpense, deleteExpense, downloadSingleExpensePDF } = require('../controllers/Expense.controller');
// const upload = require('../utils/Upload');
const { userAuth } = require('../middleware/auth');
// const downloadAsPDF = require('../utils/downloadpdf');
const s3Upload = require('../middleware/s3.upload');


router.post('/create', s3Upload.array('images'),userAuth,  createExpense);
router.get('/get-all', userAuth,getAllExpenses);
router.get('/get-by-one/:id', userAuth,getExpenseById);
router.put('/update/:id', userAuth,s3Upload.array('images'),updateExpense);
router.delete('/delete/:id', userAuth,deleteExpense);
router.get('/download-pdf/:id', userAuth, downloadSingleExpensePDF);


module.exports = router;
