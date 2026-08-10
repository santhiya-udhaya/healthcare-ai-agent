const { query } = require('../config/db');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// POST /api/records — create (with optional uploaded file via multer -> req.file)
const createRecord = asyncHandler(async (req, res) => {
  const { title, recordType, description, doctorNotes, recordDate } = req.body;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl || null;

  const result = await query(
    `INSERT INTO medical_records (patient_id, title, record_type, description, doctor_notes, file_url, record_date)
     VALUES ($1,$2,$3,$4,$5,$6, COALESCE($7, CURRENT_DATE)) RETURNING *`,
    [req.user.id, title, recordType, description, doctorNotes, fileUrl, recordDate || null]
  );
  return success(res, 201, 'Medical record created', result.rows[0]);
});

// GET /api/records
const listRecords = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM medical_records WHERE patient_id = $1 ORDER BY record_date DESC',
    [req.user.id]
  );
  return success(res, 200, 'Medical records', result.rows);
});

// GET /api/records/:id
const getRecord = asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM medical_records WHERE id = $1 AND patient_id = $2', [
    req.params.id,
    req.user.id,
  ]);
  if (!result.rows[0]) throw new ApiError(404, 'Record not found');
  return success(res, 200, 'Medical record', result.rows[0]);
});

// PUT /api/records/:id
const updateRecord = asyncHandler(async (req, res) => {
  const { title, description, doctorNotes } = req.body;
  const result = await query(
    `UPDATE medical_records SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       doctor_notes = COALESCE($3, doctor_notes)
     WHERE id = $4 AND patient_id = $5 RETURNING *`,
    [title, description, doctorNotes, req.params.id, req.user.id]
  );
  if (!result.rows[0]) throw new ApiError(404, 'Record not found');
  return success(res, 200, 'Medical record updated', result.rows[0]);
});

// DELETE /api/records/:id
const deleteRecord = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM medical_records WHERE id = $1 AND patient_id = $2 RETURNING id', [
    req.params.id,
    req.user.id,
  ]);
  if (!result.rows[0]) throw new ApiError(404, 'Record not found');
  return success(res, 200, 'Medical record deleted');
});

module.exports = { createRecord, listRecords, getRecord, updateRecord, deleteRecord };
