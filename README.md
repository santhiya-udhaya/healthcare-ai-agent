# AI Healthcare Agent
# AI Healthcare Agent

A full-stack AI-powered healthcare platform: patients manage records, book doctors, check symptoms with AI, receive prescriptions, and chat with a medical assistant. Doctors manage their schedule and issue prescriptions. Admins approve doctors and monitor the platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Chart.js, Framer Motion |
| Backend | Node.js, Express.js (MVC) |
| Database | PostgreSQL |
| Auth | JWT (access + refresh), bcrypt |
| AI | Google Gemini API (OpenAI fallback) |
| Maps | Google Maps Embed API |
| PDF | pdf-lib (prescriptions) |
| Deploy | Docker, docker-compose |

## Project Structure

```
healthcare-ai-agent/
├── backend/
│   ├── src/
│   │   ├── config/        # DB pool, migration runner
│   │   ├── controllers/   # Business logic per module
│   │   ├── routes/        # Express routers
│   │   ├── middleware/    # auth, error handling, rate limiting, validation, upload
│   │   ├── services/      # aiService, pdfService, emailService
│   │   ├── validations/   # express-validator rule chains
│   │   └── app.js
│   ├── database/schema.sql
│   ├── server.js
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/    # Layout (Sidebar, Navbar, ProtectedRoute) + UI primitives
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # Dashboard, Doctors, Appointments, SymptomChecker, Chatbot, Admin, ...
│   │   ├── services/api.js # Axios instance with silent token refresh
│   │   └── App.jsx
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Getting Started (local, without Docker)

### 1. Database
```bash
createdb healthcare_ai
cd backend
cp .env.example .env   # fill in DATABASE_URL, JWT secrets, AI keys, SMTP, Maps key
npm install
npm run migrate         # applies database/schema.sql

### Email (development)

The backend supports SMTP for transactional emails. In development, if SMTP credentials are not provided the server will automatically create an Ethereal test account and log a preview URL to the server console. In production, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `EMAIL_FROM` to enable real delivery.

```

### 2. Backend
```bash
cd backend
npm run dev              # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173

### Doctor UI: manual prescriptions

The doctor dashboard includes both an AI-driven draft flow and a "Create Manual Prescription" action. Use the doctor dashboard to select an appointment/patient, fill diagnosis/medicines/advice, and click the manual button to create and persist a prescription (PDF generated and a notification sent to the patient).

## Testing

Two test options are provided:

- Automated (Jest + Supertest): run backend unit/integration tests with `npm test` from the `backend` folder. This requires dev dependencies to be installed (`jest`, `supertest`, `cross-env`).

- Quick smoke/integration runner (no test deps): you can run a one-shot Node script against the running backend to exercise login and prescription creation. Example:

```powershell
node -e "(async()=>{const fetch=global.fetch;const login=await fetch('http://localhost:5000/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'arjun.patel@example.com',password:'Doctor@123'})});const j=await login.json();const t=j.data.accessToken;const res=await fetch('http://localhost:5000/api/prescriptions/approve',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({patientId:'7f0e980f-c213-44e8-a94c-20ff185cb352',diagnosis:'Smoke test',medicines:[{name:'Test',dose:'1',frequency:'Once',duration:'1 day'}],advice:'Rest'} )});console.log('status',res.status);console.log(await res.text());})();"
```

If your environment cannot reach npm to install dev dependencies, use the quick smoke runner above to verify behavior against a live server.
```

## Getting Started (Docker)

```bash
cp backend/.env.example backend/.env   # fill in secrets/keys
docker compose up --build
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- PostgreSQL: localhost:5432 (schema auto-applied on first boot)

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`. At minimum, set:
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — long random strings
- `GEMINI_API_KEY` (or `OPENAI_API_KEY`) — powers the AI symptom checker and chatbot
- `GOOGLE_MAPS_API_KEY` / `VITE_GOOGLE_MAPS_API_KEY` — powers the hospital finder map
- SMTP vars — needed for the "forgot password" email; safely no-ops if left unset in dev

## Default Admin

The schema seeds one admin: `admin@healthai.com` / `Admin@123`. **Change this password immediately in any real deployment** — rotate the seeded bcrypt hash or update it via SQL after first login.

## Core Modules

- **Auth** — register, login, JWT access/refresh, forgot/reset password, protected routes
- **Dashboard** — health score, vitals (BMI, BP, heart rate, sugar), upcoming appointments, recent prescriptions/records, notifications
- **Medical Records** — CRUD, file upload/download, doctor notes
- **Doctors** — search, filter by specialization, availability, booking, cancellation
- **AI Symptom Checker** — structured AI analysis (possible conditions, precautions, specialist recommendation, urgency, disclaimer), stored in chat history
- **AI Medical Chatbot** — general medical FAQ, lifestyle/diet/exercise/medicine-reminder suggestions
- **Prescriptions** — doctor-issued, auto-generated PDF, downloadable
- **Hospital Finder** — nearby hospitals via geolocation + Haversine distance, Google Maps embed, emergency filter
- **Notifications** — appointment/medicine/system notifications, mark read
- **Admin Panel** — analytics, user management, doctor approval, appointment oversight

## Security

Helmet, CORS allow-list, rate limiting (global + stricter on auth), bcrypt password hashing (cost 12), JWT with short-lived access tokens + refresh rotation, express-validator input validation, parameterized SQL queries (no string concatenation), file-type/size limits on uploads.

## Notes

This is a complete, runnable scaffold intended as a strong foundation for a production build — wire in your own AI provider keys, SMTP credentials, and Google Maps key, review the seeded admin password, and layer in whatever additional business rules (insurance, payments, telehealth video, etc.) your deployment needs.
A full-stack AI-powered healthcare platform: patients manage records, book doctors, check symptoms with AI, receive prescriptions, and chat with a medical assistant. Doctors manage their schedule and issue prescriptions. Admins approve doctors and monitor the platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Chart.js, Framer Motion |
| Backend | Node.js, Express.js (MVC) |
| Database | PostgreSQL |
| Auth | JWT (access + refresh), bcrypt |
| AI | Google Gemini API (OpenAI fallback) |
| Maps | Google Maps Embed API |
| PDF | pdf-lib (prescriptions) |
| Deploy | Docker, docker-compose |

## Project Structure

```
healthcare-ai-agent/
├── backend/
│   ├── src/
│   │   ├── config/        # DB pool, migration runner
│   │   ├── controllers/   # Business logic per module
│   │   ├── routes/        # Express routers
│   │   ├── middleware/    # auth, error handling, rate limiting, validation, upload
│   │   ├── services/      # aiService, pdfService, emailService
│   │   ├── validations/   # express-validator rule chains
│   │   └── app.js
│   ├── database/schema.sql
│   ├── server.js
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/    # Layout (Sidebar, Navbar, ProtectedRoute) + UI primitives
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # Dashboard, Doctors, Appointments, SymptomChecker, Chatbot, Admin, ...
│   │   ├── services/api.js # Axios instance with silent token refresh
│   │   └── App.jsx
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Getting Started (local, without Docker)

### 1. Database
```bash
createdb healthcare_ai
cd backend
cp .env.example .env   # fill in DATABASE_URL, JWT secrets, AI keys, SMTP, Maps key
npm install
npm run migrate         # applies database/schema.sql
```

### Email (development)

The backend supports SMTP for transactional emails. In development, if SMTP credentials are not provided the server will automatically create an Ethereal test account and log a preview URL to the server console. In production, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `EMAIL_FROM` to enable real delivery.

### 2. Backend
```bash
cd backend
npm run dev              # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

### Doctor UI: manual prescriptions

The doctor dashboard includes both an AI-driven draft flow and a "Create Manual Prescription" action. Use the doctor dashboard to select an appointment/patient, fill diagnosis/medicines/advice, and click the manual button to create and persist a prescription (PDF generated and a notification sent to the patient).

## Testing

Two test options are provided:

- Automated (Jest + Supertest): run backend unit/integration tests with `npm test` from the `backend` folder. This requires dev dependencies to be installed (`jest`, `supertest`, `cross-env`).

- Quick smoke/integration runner (no test deps): you can run a one-shot Node script against the running backend to exercise login and prescription creation. Example:

```powershell
node -e "(async()=>{const fetch=global.fetch;const login=await fetch('http://localhost:5000/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'arjun.patel@example.com',password:'Doctor@123'})});const j=await login.json();const t=j.data.accessToken;const res=await fetch('http://localhost:5000/api/prescriptions/approve',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({patientId:'7f0e980f-c213-44e8-a94c-20ff185cb352',diagnosis:'Smoke test',medicines:[{name:'Test',dose:'1',frequency:'Once',duration:'1 day'}],advice:'Rest'} )});console.log('status',res.status);console.log(await res.text());})();"
```

If your environment cannot reach npm to install dev dependencies, use the quick smoke runner above to verify behavior against a live server.

## Getting Started (Docker)

```bash
cp backend/.env.example backend/.env   # fill in secrets/keys
docker compose up --build
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- PostgreSQL: localhost:5432 (schema auto-applied on first boot)

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`. At minimum, set:
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — long random strings
- `GEMINI_API_KEY` (or `OPENAI_API_KEY`) — powers the AI symptom checker and chatbot
- `GOOGLE_MAPS_API_KEY` / `VITE_GOOGLE_MAPS_API_KEY` — powers the hospital finder map
- SMTP vars — needed for the "forgot password" email; safely no-ops if left unset in dev

## Default Admin

The schema seeds one admin: `admin@healthai.com` / `Admin@123`. **Change this password immediately in any real deployment** — rotate the seeded bcrypt hash or update it via SQL after first login.

## Core Modules

- **Auth** — register, login, JWT access/refresh, forgot/reset password, protected routes
- **Dashboard** — health score, vitals (BMI, BP, heart rate, sugar), upcoming appointments, recent prescriptions/records, notifications
- **Medical Records** — CRUD, file upload/download, doctor notes
- **Doctors** — search, filter by specialization, availability, booking, cancellation
- **AI Symptom Checker** — structured AI analysis (possible conditions, precautions, specialist recommendation, urgency, disclaimer), stored in chat history
- **AI Medical Chatbot** — general medical FAQ, lifestyle/diet/exercise/medicine-reminder suggestions
- **Prescriptions** — doctor-issued, auto-generated PDF, downloadable
- **Hospital Finder** — nearby hospitals via geolocation + Haversine distance, Google Maps embed, emergency filter
- **Notifications** — appointment/medicine/system notifications, mark read
- **Admin Panel** — analytics, user management, doctor approval, appointment oversight

## Security

Helmet, CORS allow-list, rate limiting (global + stricter on auth), bcrypt password hashing (cost 12), JWT with short-lived access tokens + refresh rotation, express-validator input validation, parameterized SQL queries (no string concatenation), file-type/size limits on uploads.

## Notes

This is a complete, runnable scaffold intended as a strong foundation for a production build — wire in your own AI provider keys, SMTP credentials, and Google Maps key, review the seeded admin password, and layer in whatever additional business rules (insurance, payments, telehealth video, etc.) your deployment needs.
