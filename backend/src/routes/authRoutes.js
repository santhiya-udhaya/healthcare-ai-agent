const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerRules, loginRules, forgotPasswordRules, resetPasswordRules } = require('../validations/authValidation');

router.post('/register', authLimiter, registerRules, validate, ctrl.register);
router.post('/login', authLimiter, loginRules, validate, ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', protect, ctrl.logout);
router.post('/forgot-password', authLimiter, forgotPasswordRules, validate, ctrl.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordRules, validate, ctrl.resetPassword);
router.get('/me', protect, ctrl.me);

module.exports = router;
