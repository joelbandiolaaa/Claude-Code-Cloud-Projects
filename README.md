# Timeline

A private, single-user work timeline/feed — log policies, decisions, issues,
and discussions as they happen, with tags, search, date filters, and image
attachments. Gated behind a PIN since entries may cover sensitive workplace
discussions.

## Stack

- `server/` — Node/Express + SQLite (better-sqlite3), PIN-based session auth,
  images stored as base64 in SQLite.
- `frontend/` — React + Vite, dark mode, Inter (body) + Instrument Serif
  (headings/dates), SVG icons only.

## Running locally

**Backend**

```bash
cd server
npm install
TIMELINE_PIN=1234 npm run dev   # defaults to 1234 if unset — change this
```

Runs on `http://localhost:4001`.

**Frontend**

```bash
cd frontend
cp .env.example .env   # points VITE_API_URL at the backend
npm install
npm run dev
```

Runs on `http://localhost:5173`.

## Features

- Reverse-chronological feed, newest entry on top
- Each entry: timestamp (auto, editable), free-text body, tags, image
  attachments
- Tags are user-manageable (create new ones inline; not hardcoded), seeded
  with Policy / Issue / Decision / Discussion
- Filter feed by tag, date range, and free-text search
- Paste or upload a screenshot directly onto an entry; click a thumbnail to
  expand
- Edit or delete any past entry
- PIN gate (`TIMELINE_PIN` env var on the server) protects the whole app

## Notes

- Set `TIMELINE_PIN` to something other than the default before using this
  for real work.
- SQLite database lives at `server/data.sqlite` (gitignored).
