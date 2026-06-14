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

## Default admin (after seeding)

- Admin: `admin@demo.com` / `password`

Employees can be added via signup or the admin Employees page in the frontend.

