# AI Healthcare Agent

A full-stack AI-powered healthcare platform for patients, doctors, and admins. The app supports medical records, appointments, prescriptions, notifications, symptom analysis, and AI-assisted healthcare workflows.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Axios, Chart.js |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT (access + refresh), bcrypt |
| AI | Google Gemini API / OpenAI-compatible fallback |
| Maps | Google Maps Embed API |
| PDF | pdf-lib |
| Deployment | Vercel + Render or Docker Compose |

## Project Structure

```text
healthcare-ai-agent/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validations/
│   │   └── app.js
│   ├── database/schema.sql
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   ├── .env.example
│   ├── vite.config.js
│   ├── package.json
│   └── index.html
├── docker-compose.yml
├── README.md
└── .gitignore
```

## Features

- Patient dashboard and profile management
- Doctor management, appointment booking, and record access
- AI symptom checker and chatbot
- Prescription generation and PDF export
- Hospital finder and map-based search
- Notification and reminder system
- Admin dashboard for oversight and approvals
- JWT auth with refresh token rotation and bcrypt hashing

## Local Setup

### 1) Database

```bash
createdb healthcare_ai
cd backend
cp .env.example .env
npm install
npm run migrate
```

### 2) Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at:
- http://localhost:5000/api

### 3) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at:
- http://localhost:5173

### Email setup

If SMTP credentials are not provided, the app will create an Ethereal test account in development mode and log a preview URL to the console. In production, set:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

## Docker Setup

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- PostgreSQL: localhost:5432

## Default Admin Credentials

The schema seeds an admin account:

- Email: `admin@healthai.com`
- Password: `Admin@123`

Change this password immediately in production.

## Deployment Notes (Vercel + Render)

For production deployment, set the frontend and backend environment variables correctly:

### Frontend (Vercel)

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

### Backend

```env
CLIENT_URL=https://your-vercel-app.vercel.app
```

This avoids the common production issue where the frontend keeps calling `localhost` instead of the deployed backend.

## Environment Variables

At minimum, configure:

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `DATABASE_URL`
- `GEMINI_API_KEY` or `OPENAI_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- SMTP credentials for email workflows

## Security

The app includes:

- Helmet security headers
- CORS origin allow-list
- Rate limiting
- Password hashing with bcrypt
- JWT access and refresh tokens
- Parameterized SQL queries
- Upload validation for file size and MIME type

## Testing

### Backend smoke check

```powershell
node -e "(async()=>{const fetch=global.fetch;const login=await fetch('http://localhost:5000/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@healthai.com',password:'Admin@123'})});const j=await login.json();console.log(j.message);})();"
```

### Production note

The production login issue is usually caused by a frontend pointing at the wrong API base URL rather than by the auth logic itself.

## Notes

This project is structured as a solid healthcare MVP and is suitable for further extension with billing, telehealth, insurance workflows, and more advanced clinical validations.

## Security

Helmet, CORS allow-list, rate limiting (global + stricter on auth), bcrypt password hashing (cost 12), JWT with short-lived access tokens + refresh rotation, express-validator input validation, parameterized SQL queries (no string concatenation), file-type/size limits on uploads.

## Notes

This is a complete, runnable scaffold intended as a strong foundation for a production build — wire in your own AI provider keys, SMTP credentials, and Google Maps key, review the seeded admin password, and layer in whatever additional business rules (insurance, payments, telehealth video, etc.) your deployment needs.
