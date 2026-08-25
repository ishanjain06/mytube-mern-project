# MyTube - MERN YouTube Clone

MyTube is a student-level MERN capstone application for discovering, watching, and managing videos.

## Features

- Vite React frontend with React Router and Axios
- JWT register/login/logout with bcrypt password hashing
- Responsive home page, hamburger sidebar, title search, and 7 working category filters
- Video player, database-backed likes/dislikes, and comment create/read/update/delete
- Authenticated channel creation and video upload/edit/delete management
- MongoDB collections for users, channels, videos, and comments

## Run the project

1. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI` and `JWT_SECRET`.
2. In `backend`, run `pnpm install`, then `pnpm run seed` for sample content and `pnpm run dev`.
3. In `frontend`, run `pnpm install`, then `pnpm run dev`
4. Open the Vite URL shown in the terminal (usually `http://localhost:5173`).

Sample login after seeding: `demo@mytube.com` / `demo123`.

## Main API routes

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET|POST /api/videos`, `GET|PUT|DELETE /api/videos/:id`, `POST /api/videos/:id/rate`
- `POST /api/channels`, `GET /api/channels/:id`, `GET /api/channels/mine`
- `GET|POST /api/comments/:videoId`, `PUT|DELETE /api/comments/:id`

## Folder structure

`frontend/` contains the Vite React interface; `backend/` contains Express, Mongoose models, JWT auth, API routes, and the seed script. Do not commit `.env` or `node_modules`.

## Recommended meaningful commits

Create the 30 required commits as development milestones: repository setup, Vite setup, Express setup, MongoDB connection, each model, auth, middleware, home UI, header, sidebar, search, categories, video API/UI, player, rating, comments API/UI, channel API/UI, upload, editing, deleting, responsiveness, seed script, README, testing, and final review. Make commits only when the described work is actually complete.
