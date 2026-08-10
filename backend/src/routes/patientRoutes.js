const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('patient'));
router.get('/history', userController.getHistory);

module.exports = router;
