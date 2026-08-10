-- =========================================================
-- AI HEALTHCARE AGENT - NEON PRODUCTION DATABASE
-- PostgreSQL
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(5),
    allergies TEXT,
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'patient',
    is_active BOOLEAN DEFAULT TRUE,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5);
ALTER TABLE users ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'patient';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);


-- =========================================================
-- VITALS
-- =========================================================

CREATE TABLE IF NOT EXISTS vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bmi NUMERIC(5,2),
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    heart_rate INT,
    sugar_level NUMERIC(5,2),
    health_score INT,
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vitals_user
ON vitals(user_id);


-- =========================================================
-- DOCTORS
-- =========================================================

CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    qualification VARCHAR(150),
    experience_years INT DEFAULT 0,
    consultation_fee NUMERIC(10,2) DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 0,
    bio TEXT,
    avatar_url TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    availability JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctors_specialization
ON doctors(specialization);

CREATE INDEX IF NOT EXISTS idx_doctors_user_id
ON doctors(user_id);


-- =========================================================
-- APPOINTMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appt_patient
ON appointments(patient_id);

CREATE INDEX IF NOT EXISTS idx_appt_doctor
ON appointments(doctor_id);

CREATE INDEX IF NOT EXISTS idx_appt_date
ON appointments(appointment_date);


-- =========================================================
-- MEDICAL RECORDS
-- =========================================================

CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    record_type VARCHAR(50),
    description TEXT,
    file_url TEXT,
    doctor_notes TEXT,
    record_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_records_patient
ON medical_records(patient_id);


-- =========================================================
-- PRESCRIPTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    diagnosis TEXT,
    medicines JSONB NOT NULL DEFAULT '[]'::jsonb,
    advice TEXT,
    confidence_score NUMERIC(5,2),
    recommended_tests TEXT,
    specialist_referral TEXT,
    is_emergency BOOLEAN DEFAULT FALSE,
    emergency_note TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient
ON prescriptions(patient_id);

CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor
ON prescriptions(doctor_id);


-- =========================================================
-- HOSPITALS
-- =========================================================

CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    address TEXT,
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    phone VARCHAR(20),
    is_emergency BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);


-- =========================================================
-- NOTIFICATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
ON notifications(user_id);


-- =========================================================
-- ADMINS
-- =========================================================

CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);


-- =========================================================
-- CHAT HISTORY
-- =========================================================

CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(30) NOT NULL,
    role VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_user
ON chat_history(user_id);


-- =========================================================
-- SYMPTOM HISTORY
-- IMPORTANT: duration and temperature are created here
-- =========================================================

CREATE TABLE IF NOT EXISTS symptom_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    symptoms TEXT,
    severity INT,
    age INT,
    gender VARCHAR(20),

    weight NUMERIC(5,2),
    height NUMERIC(5,2),

    existing_diseases TEXT,
    allergies TEXT,
    current_medicines TEXT,

    pregnancy VARCHAR(20),
    lifestyle TEXT,
    water_intake TEXT,
    sleep_hours NUMERIC(4,2),

    duration TEXT,
    temperature NUMERIC(5,2),

    result_summary JSONB DEFAULT '{}'::jsonb,
    urgency VARCHAR(30),

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_symptom_history_user
ON symptom_history(user_id);


-- =========================================================
-- AI SESSIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS ai_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    result JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_user
ON ai_sessions(user_id);


-- =========================================================
-- MEDICINE REMINDERS
-- =========================================================

CREATE TABLE IF NOT EXISTS medicine_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    reminder_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicine_reminders_user
ON medicine_reminders(user_id);


-- =========================================================
-- WATER TRACKING
-- =========================================================

CREATE TABLE IF NOT EXISTS water_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_ml INT NOT NULL DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_tracking_user
ON water_tracking(user_id);


-- =========================================================
-- SLEEP TRACKING
-- =========================================================

CREATE TABLE IF NOT EXISTS sleep_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hours_slept NUMERIC(4,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sleep_tracking_user
ON sleep_tracking(user_id);


-- =========================================================
-- ADMIN SEED
-- Password: Admin@123
-- =========================================================

INSERT INTO admins (
    full_name,
    email,
    password_hash
)
VALUES (
    'Super Admin',
    'admin@healthai.com',
    '$2b$10$8K1p/a0dURXAM7Cq8w4qMuVEYd1lqmjRw2CmXeF07eG1boYS6XKZW'
)
ON CONFLICT (email) DO NOTHING;


-- =========================================================
-- ALSO CREATE ADMIN IN USERS
-- This is important if your authController authenticates
-- admins through the users table.
-- =========================================================

INSERT INTO users (
    full_name,
    email,
    password_hash,
    role,
    is_active
)
VALUES (
    'Super Admin',
    'admin@healthai.com',
    '$2b$10$8K1p/a0dURXAM7Cq8w4qMuVEYd1lqmjRw2CmXeF07eG1boYS6XKZW',
    'admin',
    TRUE
)
ON CONFLICT (email) DO UPDATE
SET role = 'admin',
    is_active = TRUE;


-- =========================================================
-- FINAL VERIFICATION
-- =========================================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;