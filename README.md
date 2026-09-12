# Recording Studio Session Booking App

A full-stack web application where **artists** can browse recording studios and book
sessions with **engineers**. Built as the final project for OPA's Coding Factory 10.

## Domain Model

The application is built around three core entities (Domain-Driven Design):

- **User** — an artist, engineer, or admin, identified by email with a role-based permission system
- **Studio** — owned by an engineer, has a name, location, and hourly rate
- **Booking** — an artist reserving a studio for a specific time slot, with automatic
  overlap prevention and price calculation

## Tech Stack

| Layer     | Technology                                        |
|-----------|-------------------------------------------------- |
| Frontend  | React 19 (Vite), React Router, Axios              |
| Backend   | Node.js, Express, layered architecture (Repository / Service / Controller) |
| Database  | PostgreSQL (runs in Docker)                       |
| Auth      | JWT (JSON Web Tokens), bcrypt password hashing, role-based authorization |
| API Docs  | Swagger (OpenAPI 3.0), available at `/api-docs`   |
| Testing   | Jest (unit tests for services)                    |

## Project Structure

```
studio-booking/
├── backend/              # Express REST API
│   ├── src/
│   │   ├── config/       # DB connection, Swagger config, SQL schema
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Database access layer
│   │   ├── routes/       # Express route definitions
│   │   ├── middleware/   # JWT auth, error handling
│   │   └── scripts/      # Seed script
│   └── tests/            # Jest unit tests
├── frontend/              # React (Vite) single-page app
│   └── src/
│       ├── api/           # Axios API calls
│       ├── context/        # Auth context (JWT state)
│       ├── components/     # Navbar, ProtectedRoute
│       └── pages/          # Login, Register, Studios, Booking, Admin
└── docker-compose.yml     # PostgreSQL + Adminer
```

## How to Build and Run (Local Development)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/) v18+

### 1. Start the database

From the project root:

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432` (schema is loaded automatically on first run)
- **Adminer** (DB admin UI) on `localhost:8080`

### 2. Start the backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The API will be running at `http://localhost:5000`.
Swagger documentation: `http://localhost:5000/api-docs`

### 3. (Optional but recommended) Seed sample data

To populate the database with demo users, studios, and a sample booking so the app
can be explored immediately without manual registration:

```bash
npm run seed
```

This creates:

| Role     | Email                  | Password      |
|----------|-------------------------|---------------|
| Engineer | engineer@example.com    | password123   |
| Artist   | artist@example.com      | password123   |
| Admin    | admin@example.com       | password123   |

### 4. Start the frontend

In a new terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The app will be running at `http://localhost:5173`.

### 5. Run backend tests

```bash
cd backend
npm test
```

## Deployment Notes

- The backend is a stateless Express app — it can be deployed to any Node.js host
  (Render, Railway, Fly.io, etc.) as long as it can reach a PostgreSQL instance.
- The frontend is a static build (`npm run build` in `frontend/` produces a `dist/`
  folder) that can be served from any static host (Vercel, Netlify, Nginx, etc.) or
  from the backend itself via a static file middleware.
- Set the `VITE_API_URL` environment variable on the frontend to point to the
  deployed backend URL, and update CORS settings in `backend/src/server.js`
  accordingly.
- In production, set a strong, random `JWT_SECRET` in the backend's environment
  variables (never commit real secrets to git — `.env` is gitignored).

## API Overview

| Method | Endpoint                     | Description                          | Auth required      |
|--------|-------------------------------|---------------------------------------|---------------------|
| POST   | `/api/auth/register`          | Register a new user                   | No                   |
| POST   | `/api/auth/login`             | Log in, returns JWT                   | No                   |
| GET    | `/api/studios`                | List all studios                      | No                   |
| GET    | `/api/studios/:id`            | Get a single studio                   | No                   |
| POST   | `/api/studios`                | Create a studio                       | Yes (engineer/admin) |
| PUT    | `/api/studios/:id`            | Update a studio                       | Yes (owner engineer) |
| DELETE | `/api/studios/:id`            | Delete a studio                       | Yes (owner engineer) |
| POST   | `/api/bookings`               | Create a booking                      | Yes (artist)         |
| GET    | `/api/bookings/me`             | List the logged-in artist's bookings  | Yes (artist)         |
| GET    | `/api/bookings`               | List all bookings                     | Yes (admin/engineer) |
| PATCH  | `/api/bookings/:id/status`     | Update a booking's status             | Yes (admin/engineer) |
| PATCH  | `/api/bookings/:id/cancel`     | Cancel your own booking               | Yes (artist)          |

Full interactive documentation is available via Swagger at `/api-docs` once the
backend is running.
