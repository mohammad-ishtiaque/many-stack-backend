const express = require('express');
const router = express.Router();

const {
    createPrivacyPolicy,
    getPrivacyPolicy,
    updatePrivacyPolicy,
    createTermsConditions,
    getTermsConditions,
    updateTermsConditions,
    createContactUs,
    getContactUs,
    updateContactUs,
    deleteContactUs,
} = require('../../controllers/Dashboard/Settings.controller');


const {auth, adminAuth} = require('../../middleware/auth')

router.post('/privacy-policy/create', auth, adminAuth, createPrivacyPolicy);
router.get('/privacy-policy/get', auth, getPrivacyPolicy);
router.put('/privacy-policy/:id', auth, adminAuth, updatePrivacyPolicy);

router.post('/terms-conditions/create', auth, adminAuth, createTermsConditions);
router.get('/terms-conditions/get', auth, getTermsConditions);
router.put('/terms-conditions/:id', auth, adminAuth, updateTermsConditions);

router.post('/contact-us/create', auth, adminAuth, createContactUs);
router.get('/contact-us/get', auth, getContactUs);
router.put('/contact-us/update/:id', auth, adminAuth, updateContactUs);
router.delete('/contact-us/delete/:id', auth, adminAuth, deleteContactUs);

module.exports = router;