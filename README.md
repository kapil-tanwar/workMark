# Attend Easy — WorkFlow HR

| Folder | Description | Dev URL |
|--------|-------------|---------|
| [`frontend/`](frontend/) | React frontend (TanStack Start + Vite) | http://localhost:8080 |
| [`backend/`](backend/) | Express + MongoDB API | http://localhost:4000 |

## Quick start

**Backend** (start first)

```bash
cd backend
cp .env.example .env   # set MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

**Frontend**

```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:4000
npm install
npm run dev
```

Set `CORS_ORIGIN=http://localhost:8080` in `backend/.env`.

### MongoDB

Database connection is configured in `backend/src/config/db.js` and uses `MONGODB_URI` from `backend/.env`.

```bash
# Local MongoDB example
MONGODB_URI=mongodb://127.0.0.1:27017/attend_easy
```

Install and start [MongoDB Community Server](https://www.mongodb.com/try/download/community), or use a valid MongoDB Atlas connection string.

Check connection: `GET http://localhost:4000/health` returns `{ ok: true, db: { ... } }`.
