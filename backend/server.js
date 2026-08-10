require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const { pool } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

let server;

async function start() {
  try {
    // Check database connection
    await pool.query('SELECT 1');

    server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(
        `🚀 AI Healthcare Agent API listening on port ${PORT} [${
          process.env.NODE_ENV || 'development'
        }]`
      );
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        process.exit(1);
      }

      console.error(err);
    });

  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }
}

start();

async function shutdown() {
  console.log('\n🛑 Shutting down server...');

  if (server) {
    server.close(async () => {
      await pool.end();
      console.log('✅ PostgreSQL connection closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});