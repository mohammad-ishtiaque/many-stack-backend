const express = require('express');
const router = express.Router();
const interventionController = require('../controllers/Intervention.controller');
const { auth } = require('../middleware/auth');
const upload = require('../utils/Upload');

router.post('/create', auth, upload.array('images'), interventionController.createIntervention);
router.get('/get-all/', auth, interventionController.getAllInterventions);
router.get('/get-by-id/:id', auth, interventionController.getInterventionById);
router.put('/update/:id', auth, upload.array('images'), interventionController.updateIntervention);
router.delete('/delete/:id', auth, interventionController.deleteIntervention);



router.delete('/delete-image/:id', auth, interventionController.deleteImage);
router.post('/add-image/:id', auth, upload.array('images'), interventionController.addImages);
// // Download invoice as PDF
router.get('/download-pdf/:id', auth, interventionController.downloadSingleInterventionPDF);

module.exports = router;
