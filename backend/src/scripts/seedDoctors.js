const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/db');

const doctors = [
  {
    fullName: 'Dr. Arjun Patel',
    email: 'arjun.patel@example.com',
    password: 'Doctor@123',
    specialization: 'General Physician',
    qualification: 'MBBS, MD',
    experienceYears: 8,
    consultationFee: 250.0,
    rating: 4.8,
    bio: 'Experienced general physician focused on preventive care and chronic disease management.',
    avatarUrl: 'https://images.unsplash.com/photo-1580281657521-27bb7b5a4c48?auto=format&fit=crop&w=400&q=80',
    isApproved: true,
    availability: {
      mon: ['09:00-12:00', '14:00-17:00'],
      wed: ['09:00-12:00'],
      fri: ['10:00-14:00'],
    },
  },
  {
    fullName: 'Dr. Meera Sharma',
    email: 'meera.sharma@example.com',
    password: 'Doctor@123',
    specialization: 'Pediatrics',
    qualification: 'MBBS, DCH',
    experienceYears: 6,
    consultationFee: 300.0,
    rating: 4.9,
    bio: 'Dedicated pediatrician with a strong track record in child wellness and immunization programs.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    isApproved: true,
    availability: {
      tue: ['10:00-13:00'],
      thu: ['11:00-15:00'],
      sat: ['09:00-12:00'],
    },
  },
  {
    fullName: 'Dr. Kavita Nair',
    email: 'kavita.nair@example.com',
    password: 'Doctor@123',
    specialization: 'Cardiology',
    qualification: 'MBBS, DM',
    experienceYears: 12,
    consultationFee: 450.0,
    rating: 4.7,
    bio: 'Cardiologist specializing in heart health, lifestyle counseling and preventive cardiology.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    isApproved: true,
    availability: {
      mon: ['14:00-18:00'],
      wed: ['14:00-18:00'],
      fri: ['14:00-18:00'],
    },
  },
];

async function seedDoctors() {
  try {
    const emails = doctors.map((doctor) => doctor.email);

    await query('DELETE FROM doctors WHERE email = ANY($1)', [emails]);
    await query("DELETE FROM users WHERE email = ANY($1)", [emails]);

    for (const doctor of doctors) {
      const passwordHash = await bcrypt.hash(doctor.password, 12);

      const userResult = await query(
        `INSERT INTO users (
           full_name,
           email,
           password_hash,
           role,
           is_active
         ) VALUES ($1, $2, $3, 'doctor', TRUE)
         RETURNING id`,
        [doctor.fullName, doctor.email, passwordHash]
      );

      const userId = userResult.rows[0].id;

      await query(
        `INSERT INTO doctors (
           user_id,
           full_name,
           email,
           password_hash,
           specialization,
           qualification,
           experience_years,
           consultation_fee,
           rating,
           bio,
           avatar_url,
           is_approved,
           availability
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          userId,
          doctor.fullName,
          doctor.email,
          passwordHash,
          doctor.specialization,
          doctor.qualification,
          doctor.experienceYears,
          doctor.consultationFee,
          doctor.rating,
          doctor.bio,
          doctor.avatarUrl,
          doctor.isApproved,
          JSON.stringify(doctor.availability),
        ]
      );
    }

    console.log('✅ Doctor seed complete.');
  } catch (err) {
    console.error('❌ Doctor seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDoctors();
