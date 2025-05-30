const express = require('express');
const router = express.Router();
const userController = require('../controllers/User.controller');
const { auth } = require('../middleware/auth');

router.get('/', auth,  userController.getUser);
router.put('/update/:id',auth,  userController.updateUser);
router.delete('/:id', auth, userController.deleteUser);

module.exports = router;
