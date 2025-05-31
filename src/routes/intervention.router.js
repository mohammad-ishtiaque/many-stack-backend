const express = require('express');
const router = express.Router();
const interventionController = require('../controllers/Intervention.controller');
const { auth } = require('../middleware/auth');
const upload = require('../utils/Upload');

router.post('/create', auth, upload.array('images'), interventionController.createIntervention);
router.get('/get-all', auth, interventionController.getAllInterventions);
router.get('/get-by-id/:id', auth, interventionController.getInterventionById);
router.put('/update/:id', auth, upload.array('images'), interventionController.updateIntervention);
router.delete('/delete/:id', auth, interventionController.deleteIntervention);



router.delete('/:id/images', auth, interventionController.deleteImage);
router.post('/:id/images', auth, upload.array('images'), interventionController.addImages);
module.exports = router;
