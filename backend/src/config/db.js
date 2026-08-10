const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({
  path:
    process.env.NODE_ENV === 'test'
      ? path.resolve(__dirname, '../../.env.test')
      : path.resolve(__dirname, '../../.env'),
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error on idle client', err);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
