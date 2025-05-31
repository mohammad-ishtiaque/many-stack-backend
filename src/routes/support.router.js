const express = require('express');
const router = express.Router();
const { createSupport, getAllSupports, getSupportById, updateSupport, deleteSupport } = require('../controllers/Support.controller');
const { auth } = require('../middleware/auth');

router.post('/create', auth, createSupport);
router.get('/get-all', auth, getAllSupports);
router.get('/get-one/:id', auth, getSupportById);
router.put('/update/:id', auth, updateSupport);
router.delete('/delete/:id', auth, deleteSupport);

module.exports = router;

