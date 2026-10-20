# WorkMark (Attend Easy — WorkFlow HR)

| Folder | Description | Dev URL |
|---|---|---|
| [`frontend/`](frontend/) | React frontend (React Router + Vite + Tailwind CSS v4) | http://localhost:8080 |
| [`backend/`](backend/) | Express + MongoDB API + Groq AI Assistant | http://localhost:4000 |

---

## 1. Project Overview

**WorkMark** (also known as **Attend Easy — WorkFlow HR**) is an enterprise-ready **Human Resource Management (HRMS) & Attendance Tracking Platform**. It streamlines attendance logging, shift timings, break monitoring, leave management, compensatory off (Comp-Off) workflows, organizational analytics, and includes an autonomous **AI HR Assistant** capable of querying employee balances and records via tool calling.

### Key Objectives
- **Automate Attendance Tracking**: Accurate clock-in/out, break duration calculations, and late arrival detection.
- **Leave Ledger & Accrual Engine**: Automated earned leave monthly accruals, multi-type leave applications, and comp-off claims with administrative approval chains.
- **AI-Powered Self-Service**: Conversational AI assistant for employees to query balances, attendance summaries, and company records in natural language.
- **Admin Control & Analytics**: Real-time dashboards, department-level reports, employee lifecycle management, and company policy configurations.

---

## 2. Architecture & System Design

```
+-------------------------------------------------------------+
|                     Client Application                      |
|          React 19 + Vite 7 + Tailwind CSS v4 + Radix UI     |
+-------------------------------------------------------------+
                              |
                     HTTP / JSON REST API
                              |
                              v
+-------------------------------------------------------------+
|                     Backend API Server                      |
|            Node.js (ESM) + Express 4 + Mongoose 8           |
+-------------------------------------------------------------+
         |                        |                     |
         v                        v                     v
+------------------+    +------------------+   +-------------------+
|  MongoDB Database|    | Groq Cloud API   |   | TOTP / 2FA Engine |
|  Atlas / Local   |    | LLaMA 3.3 70B    |   | otplib + qrcode   |
+------------------+    +------------------+   +-------------------+
```

---

## 3. Environment Variables Setup

### Backend Environment (`backend/.env`)
```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/attend_easy
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:8080
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

### Frontend Environment (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:4000
```

---

## 4. Step-by-Step Installation & Quickstart

### Step 1: Ensure MongoDB is Running
Make sure you have [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally or use a MongoDB Atlas connection string.

### Step 2: Start Backend Server (Start First)
```bash
cd backend
npm install
npm run seed      # Populates initial admin & employee accounts
npm run dev       # Starts Express API at http://localhost:4000
```
Check health: `GET http://localhost:4000/health` returns `{ ok: true, db: { ... } }`.

### Step 3: Start Frontend Client
```bash
cd frontend
npm install
npm run dev       # Starts Vite dev server at http://localhost:8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### Default Seeded Credentials
- **Admin**: `admin@admin.com` (ID: `admin00`) / `password`
- **Employee**: `employee@employee.com` (ID: `employee00`) / `password`

---

## 5. Docker Deployment

To spin up the entire application stack using Docker Compose:

```bash
# From the project root:
docker-compose up --build -d
```

- **Frontend Application**: `http://localhost:8080`
- **Backend API**: `http://localhost:4000`
- **Stop containers**: `docker-compose down`

---
