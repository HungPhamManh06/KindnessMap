# 💚 KindnessMap – Bản Đồ Việc Tốt

Full-stack community platform for sharing, mapping and discovering kind actions across Vietnam.

Live demo: https://kindnessmap-vn.vercel.app/

---

## 📁 Clean Project Structure

```txt
KindnessMap/
├── backend/                 # Express API, database init, auth, admin, posts, matching
│   ├── config/              # Database connection and auto schema/seed init
│   ├── controllers/         # Route handlers/business logic
│   ├── data/                # Seed datasets, e.g. 300 community posts
│   ├── middleware/          # Auth/admin middleware
│   ├── routes/              # Express routes
│   ├── scripts/             # Utility/import scripts
│   ├── package.json
│   └── server.js
├── frontend/                # React + Vite + Tailwind UI
│   ├── public/              # Static files/geojson
│   ├── src/
│   │   ├── components/      # Navbar, modals, map, toggles, UI components
│   │   ├── context/         # Auth, theme, notification, language providers
│   │   ├── i18n/            # Vietnamese/English dictionary and DOM bridge
│   │   ├── pages/           # Home, Stories, Map, Admin, Matching, Profile...
│   │   └── services/        # API client
│   ├── package.json
│   └── vercel.json
├── database/                # Portable SQL schema and seed reference files
│   ├── schema.sql
│   └── seeds.sql
├── package.json             # Root monorepo scripts
├── package-lock.json
├── .gitignore
└── README.md
```

The old nested `kindness-map/` folder has been removed so the repository root is now the actual project root.

---

## 🚀 Local Development

### Install all dependencies

```bash
npm install
```

The root `postinstall` script installs both backend and frontend dependencies.

### Run backend + frontend together

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/health

### Run separately

```bash
npm run dev:backend
npm run dev:frontend
```

---

## 🌱 Import 300 Community Seed Posts

The dataset is stored in:

```txt
backend/data/community_posts_300.json
backend/data/community_posts_300.sql
```

Import into the active backend database:

```bash
cd backend
npm run import:community
```

Notes:

- The script skips duplicate titles.
- Images are saved as URL references, not binary files, to keep the database small.
- If no cloud database is configured, the backend falls back to SQLite.

---

## 🌐 Deployment Settings

### Render backend

Use this after the restructure:

```txt
Root Directory: backend
Build Command: npm install
Start Command: npm run import:community && npm start
```

If you do **not** use MySQL/Aiven, remove `DATABASE_URL` from Render environment variables so the backend uses SQLite fallback.

### Vercel frontend

Use this after the restructure:

```txt
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

`frontend/vercel.json` rewrites `/api/*` to the Render backend.

---

## 🔐 Demo Accounts

Admin:

```txt
admin@kindnessmap.vn
password123
```

Volunteer/user:

```txt
hoangyen.volunteer@gmail.com
password123
```

---

## ✨ Key Features

- Vietnamese/English bilingual UI toggle
- User registration/login/profile
- Admin moderation and role management
- Good deed post submission and map pinning
- AI matching: capability profile ↔ support requests
- Leaderboard, badges, monthly awards
- Real public stats on homepage
- 300 seeded community/charity activity posts
