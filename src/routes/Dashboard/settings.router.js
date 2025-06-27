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


const {adminOrSuperAdminAuth} = require('../../middleware/auth')

router.post('/privacy-policy/create',  adminOrSuperAdminAuth, createPrivacyPolicy);
router.get('/privacy-policy/get',  getPrivacyPolicy);
router.put('/privacy-policy/:id',  adminOrSuperAdminAuth, updatePrivacyPolicy);

router.post('/terms-conditions/create',  adminOrSuperAdminAuth, createTermsConditions);
router.get('/terms-conditions/get',  getTermsConditions);
router.put('/terms-conditions/update/:id',  adminOrSuperAdminAuth, updateTermsConditions);

router.post('/contact-us/create',  adminOrSuperAdminAuth, createContactUs);
router.get('/contact-us/get',  getContactUs);
router.put('/contact-us/update/:id',  adminOrSuperAdminAuth, updateContactUs);
router.delete('/contact-us/delete/:id',  adminOrSuperAdminAuth, deleteContactUs);

module.exports = router;