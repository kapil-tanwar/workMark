# backend — WorkFlow HR API

Express + MongoDB API for the WorkFlow HR frontend.

The frontend is in the sibling folder [`../frontend/`](../frontend/).

## Quick start

```bash
npm install
cp .env.example .env       # edit MONGODB_URI and JWT_SECRET
npm run seed               # optional: seed admin user
npm run dev                # http://localhost:4000
```

Requires MongoDB (local or Atlas). For local dev, use:

```
MONGODB_URI=mongodb://127.0.0.1:27017/attend_easy
```

Install [MongoDB Community Server](https://www.mongodb.com/try/download/community) and ensure it is running before starting the API.

## Default Demo Accounts (Auto-seeded)

- Admin: `admin@admin.com` (ID: `admin00`) / `password`
- Employee: `employee@employee.com` (ID: `employee00`) / `password`

Employees can be added via signup or the admin Employees page in the frontend.

## Environment

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `4000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for auth tokens |
| `CORS_ORIGIN` | Frontend URL (default `http://localhost:8080`) |
| `APP_URL` | Public frontend URL used in invitation links (default: first `CORS_ORIGIN`) |
| `GROQ_API_KEY` | Groq API key |


## Bulk employee import

Admin-only (JWT + `adminOnly`). Limits: 2 MB, 1000 rows per file, `.csv` / `.xlsx`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/employees/bulk-import/template?format=xlsx\|csv` | Download sample template |
| GET | `/api/employees/bulk-import/spec` | Columns and limits |
| POST | `/api/employees/bulk-import/preview` | Parse + validate (multipart `file`); writes nothing |
| POST | `/api/employees/bulk-import` | Re-validate and import valid rows; returns summary, per-row results, one-time invitation links |
| POST | `/api/employees/:id/invite` | Issue a fresh invitation link for an employee who has not set a password |
| GET | `/api/auth/invite/:token` | (public) Validate an invitation link |
| POST | `/api/auth/invite/accept` | (public) Set password via invitation `{ token, password }` |

Imported accounts are always `employee`, carry no password, and must activate through a single-use
link (valid 7 days; only its SHA-256 hash is stored). Imports and invite actions are written to the
`AuditLog` collection. Run the tests with `MONGODB_URI=mongodb://127.0.0.1:27017/workmark_test npm test`
(the database name must end in `_test`; it is dropped).
