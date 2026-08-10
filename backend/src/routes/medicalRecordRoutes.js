const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/medicalRecordController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.post('/', upload.single('file'), ctrl.createRecord);
router.get('/', ctrl.listRecords);
router.get('/:id', ctrl.getRecord);
router.put('/:id', ctrl.updateRecord);
router.delete('/:id', ctrl.deleteRecord);

module.exports = router;
