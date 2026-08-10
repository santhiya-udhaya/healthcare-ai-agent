const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

require('dotenv').config({
  path:
    process.env.NODE_ENV === 'test'
      ? path.resolve(__dirname, '../../.env.test')
      : path.resolve(__dirname, '../../.env'),
});

const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const vitalRoutes = require('./routes/vitalRoutes');
const trackingRoutes = require('./routes/trackingRoutes');

const app = express();

// ---------------- Security ----------------

app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan(
    process.env.NODE_ENV === 'production'
      ? 'combined'
      : 'dev'
  )
);

app.use('/api', apiLimiter);

// ---------------- Static Files ----------------

app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'))
);

// ---------------- Health Check ----------------

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Healthcare Agent API is running',
  });
});

// ---------------- Routes ----------------

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records', medicalRecordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/tracking', trackingRoutes);

// ---------------- Error Handling ----------------

app.use(notFound);
app.use(errorHandler);

module.exports = app;