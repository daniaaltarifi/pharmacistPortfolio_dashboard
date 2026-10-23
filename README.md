# The Formula Admin

Admin dashboard for the portfolio. Edit every portfolio section, read contact messages, and upload images, all through the existing API in `../server`.

## Run it

```bash
# 1. The API (from ../server)
npm run dev            # http://localhost:5000

# 2. The dashboard (from this folder)
npm install
npm run dev            # http://localhost:5174
```

Sign in with the admin account created by `npm run db:seed` in the server (`ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env`).

In development, Vite forwards `/api` to `http://localhost:5000`, so no extra setup is needed.

## Settings

Copy `.env.example` to `.env` if you need to change these:

| Variable | Default | Used for |
| --- | --- | --- |
| `VITE_API_URL` | empty (uses the dev proxy) | The deployed API origin in production |
| `VITE_SITE_URL` | `http://localhost:5173` | "View site" links, and previews of images stored as site paths like `/images/...` |

For production, also add the dashboard's address to `CLIENT_ORIGIN` in `server/.env` (comma-separated), or the API will refuse its requests.

## Where things live

- `src/lib/sections.js`: one entry per portfolio section, with its fields, limits and table columns. The limits mirror `server/validators`, so to add a field, update both.
- `src/pages/section-page.jsx`: the table and edit panel shared by every section.
- `src/pages/messages.jsx`: the inbox. Which messages are read is remembered per browser; the server stores only the messages.
- `src/index.css`: colors and the portfolio gradient.
