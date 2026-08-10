/* Small helpers to keep JSON responses consistent across every controller */
function success(res, statusCode, message, data = null, meta = null) {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
}

module.exports = { success };
