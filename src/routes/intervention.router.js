const express = require('express');
const router = express.Router();
const interventionController = require('../controllers/Intervention.controller');
const { userAuth } = require('../middleware/auth');
const upload = require('../utils/Upload');

router.post('/create', userAuth, upload.array('images'), interventionController.createIntervention);
router.get('/get-all/', userAuth, interventionController.getAllInterventions);
router.get('/get-by-id/:id', userAuth, interventionController.getInterventionById);
router.put('/update/:id', userAuth, upload.array('images'), interventionController.updateIntervention);
router.delete('/delete/:id', userAuth, interventionController.deleteIntervention);



router.delete('/delete-image/:id', userAuth, interventionController.deleteImage);
router.post('/add-image/:id', userAuth, upload.array('images'), interventionController.addImages);
// // Download invoice as PDF
router.get('/download-pdf/:id', userAuth, interventionController.downloadInterventionPDF);
router.put('/paid-unpaid/:id', userAuth, interventionController.paidUnpaid);


module.exports = router;
