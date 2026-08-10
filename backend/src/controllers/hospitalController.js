const { query } = require('../config/db');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/hospitals/nearby?lat=&lng=&emergencyOnly=
const nearbyHospitals = asyncHandler(async (req, res) => {
  const { lat, lng, emergencyOnly } = req.query;
  const params = [];
  let where = '';
  if (emergencyOnly === 'true') where = 'WHERE is_emergency = TRUE';

  const result = await query(`SELECT * FROM hospitals ${where}`, params);
  let hospitals = result.rows;

  if (lat && lng) {
    hospitals = hospitals
      .map((h) => ({
        ...h,
        distanceKm: h.latitude && h.longitude ? Number(haversineKm(Number(lat), Number(lng), Number(h.latitude), Number(h.longitude)).toFixed(2)) : null,
      }))
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }

  return success(res, 200, 'Nearby hospitals', hospitals);
});

// POST /api/hospitals  (admin)
const addHospital = asyncHandler(async (req, res) => {
  const { name, address, latitude, longitude, phone, isEmergency } = req.body;
  const result = await query(
    `INSERT INTO hospitals (name, address, latitude, longitude, phone, is_emergency)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [name, address, latitude, longitude, phone, !!isEmergency]
  );
  return success(res, 201, 'Hospital added', result.rows[0]);
});

module.exports = { nearbyHospitals, addHospital };
