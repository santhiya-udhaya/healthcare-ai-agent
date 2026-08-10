const { body } = require('express-validator');

const bookRules = [
  body('doctorId').isUUID().withMessage('Valid doctorId is required'),
  body('appointmentDate').isISO8601().withMessage('Valid date (YYYY-MM-DD) is required'),
  body('appointmentTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Valid time (HH:MM) is required'),
  body('reason').optional().isLength({ max: 500 }),
];

module.exports = { bookRules };
