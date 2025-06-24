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


const {auth, adminOrSuperadmin} = require('../../middleware/auth')

router.post('/privacy-policy/create', auth, adminOrSuperadmin, createPrivacyPolicy);
router.get('/privacy-policy/get', auth, getPrivacyPolicy);
router.put('/privacy-policy/:id', auth, adminOrSuperadmin, updatePrivacyPolicy);

router.post('/terms-conditions/create', auth, adminOrSuperadmin, createTermsConditions);
router.get('/terms-conditions/get', auth, getTermsConditions);
router.put('/terms-conditions/:id', auth, adminOrSuperadmin, updateTermsConditions);

router.post('/contact-us/create', auth, adminOrSuperadmin, createContactUs);
router.get('/contact-us/get', auth, getContactUs);
router.put('/contact-us/update/:id', auth, adminOrSuperadmin, updateContactUs);
router.delete('/contact-us/delete/:id', auth, adminOrSuperadmin, deleteContactUs);

module.exports = router;