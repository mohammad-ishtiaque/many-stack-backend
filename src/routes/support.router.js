const express = require('express');
const router = express.Router();
const { createSupport, getAllSupports, getSupportById, updateSupport, deleteSupport } = require('../controllers/Support.controller');
const { userAuth } = require('../middleware/auth');

router.post('/create', userAuth, createSupport);
router.get('/get-all', userAuth, getAllSupports);
router.get('/get-one/:id', userAuth, getSupportById);
router.put('/update/:id', userAuth, updateSupport);
router.delete('/delete/:id', userAuth, deleteSupport);

module.exports = router;

