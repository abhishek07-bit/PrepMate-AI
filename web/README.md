# PrepMate AI — Web Application

Adaptive AI-powered interview preparation platform combining resume auditing, job-description match scoring, company-specific prep, voice-enabled mock interviews, and performance analytics.

- **Production Frontend:** https://prepmatethree-ai.vercel.app/
- **Production Backend:** https://prepmate-api-47v8.onrender.com

---

## Architecture

```text
web/
├── package.json                     # Wrapper scripts (--prefix frontend)
├── vercel.json                      # Vercel deployment config (outputDirectory: frontend/dist)
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, lifespan (DB init + Firebase Admin), CORS, health & AI status
│   │   ├── core/config.py           # Environment settings & production SECRET_KEY guard
│   │   ├── db/database.py           # DB URL sanitizer, SQLAlchemy engine, SessionLocal, init_db
│   │   ├── models/models.py         # User, Resume, InterviewSession, Question, Answer, FeedbackReport
│   │   ├── auth/routes.py           # Hybrid Firebase ID token + HS256 JWT auth, JIT user creation, profile & deletion
│   │   ├── resume/
│   │   │   ├── parser.py            # PDF/DOCX text extraction (NUL-byte safe) & boundary-safe skill matching
│   │   │   └── routes.py            # Upload, latest resume, skills, deep ATS audit, job match, delete
│   │   ├── api/routes.py            # Interview setup, questions, answer eval, locked feedback report, company prep cache
│   │   ├── analytics/routes.py      # Readiness, category weaknesses, completed session history
│   │   └── services/ai_service.py   # Pooled async LLM client, 4-provider fallback, PII redaction, schema normalization
│   ├── tests/                       # Unit & integration tests (unittest)
│   ├── migrate_db.py                # Legacy PostgreSQL column migration helper
│   ├── render.yaml                  # Render service blueprint (Python 3.11.9)
│   └── requirements.txt
└── frontend/
    ├── index.html                   # Geist + Material Symbols fonts, metadata
    ├── tailwind.config.js           # Custom Pebble design tokens, darkMode: class
    ├── tsconfig.json                # Strict TypeScript (noUnusedLocals, noUnusedParameters)
    ├── vercel.json                  # Vercel SPA rewrite & build config (Root Directory = web/frontend)
    └── src/
        ├── api/client.ts            # Axios instance, fresh Firebase token injection, 401 event broadcast
        ├── hooks/                   # useVoice (TTS + iOS workaround), useSpeechToText (STT + iOS restart)
        ├── layouts/                 # AppLayout, AuthLayout, InterviewLayout
        ├── lib/firebase.ts          # Firebase Web SDK initialization
        ├── pages/                   # Lazy-loaded pages (Landing, Auth, Dashboard, Resume, Setup, MockInterview, Feedback, Analytics, CompanyPrep, Settings, Static, NotFound)
        ├── routes/index.tsx         # React Router v7 configuration + legal/guide content
        ├── store/                   # Zustand persisted & session stores (auth, interview, resume, settings, ui)
        ├── styles/index.css         # Tailwind layers, Aerodome @font-face, CSS theme variables, animations
        ├── types/index.ts           # Shared domain TypeScript interfaces
        └── utils/                   # safeId (UUID fallback), safeStorage (private-mode safe localStorage)
```

---

## Tech Stack

- **Frontend:** React 19, TypeScript 6, Vite 8, React Router 7, Tailwind CSS 3, Zustand 5, Framer Motion, Axios, Lottie (`lottie-react`), `react-hook-form`, Firebase Web Auth SDK.
- **Backend:** Python 3.11+ (3.11.9 pinned in Render), FastAPI, Uvicorn, SQLAlchemy, Pydantic, `httpx`, `python-jose`, `passlib` + `bcrypt==3.2.2`, `pypdf`, `python-docx`, `firebase-admin`.
- **Database:** PostgreSQL (Supabase in production) or SQLite (`sqlite:///./prepmate.db` local default).
- **AI Fallback Stack (`app/services/ai_service.py`):**
  1. Google Gemini (`gemini-2.5-flash`) via `x-goog-api-key` + `systemInstruction`
  2. Groq (`openai/gpt-oss-120b`)
  3. OpenRouter (`google/gemini-2.5-flash`)
  4. Cerebras (`qwen-3.8-27b`)

---

## Backend API Endpoints

| Prefix | Method & Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| Root | `GET /`, `GET /api/health` | Public | Service info and liveness check |
| Root | `GET /api/ai/status` | Public | Passive AI provider key configuration status |
| Root | `GET /api/ai/status/probe` | Bearer | Authenticated live LLM probe across fallback stack |
| Auth | `POST /api/auth/register`, `POST /api/auth/login` | Public | Local email/password auth issuing 24h HS256 JWT |
| Auth | `GET /api/auth/me`, `PUT /api/auth/update-profile`, `DELETE /api/auth/me` | Bearer | Current profile, name update, full account & file erasure |
| Resume | `POST /api/resume/upload`, `GET /api/resume/latest`, `GET /api/resume/skills` | Bearer | PDF/DOCX parsing, skill extraction, latest resume rehydration |
| Resume | `POST /api/resume/analyze/{id}`, `POST /api/resume/match/{id}`, `DELETE /api/resume/{id}` | Bearer | Cached ATS audit, job-description match ("Kill-Ratio"), deletion |
| Interview | `POST /api/interview/setup`, `GET /api/interview/{id}/questions` | Bearer | Generate 5 questions tailored to role, company, rigor, and resume skills |
| Interview | `POST /api/interview/answer/{question_id}` | Bearer | Idempotent answer scoring and feedback |
| Interview | `GET /api/interview/{id}/feedback` | Bearer | Concurrency-locked session synthesis report |
| Interview | `GET /api/interview/company/{company_name}` | Bearer | AI company prep guide (1-hour TTL cache) |
| Analytics | `GET /api/analytics/readiness`, `GET /api/analytics/weaknesses`, `GET /api/analytics/history` | Bearer | Readiness stats, low-scoring categories, completed session history |

---

## Environment Configuration

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:
- `DATABASE_URL`: PostgreSQL connection string or `sqlite:///./prepmate.db`
- `SECRET_KEY`: Strong random secret for HS256 JWT signing (required in production when `NODE_ENV=production`)
- `ALLOWED_ORIGINS`: Comma-separated CORS origins
- `UPLOAD_DIR`: Directory for uploaded resumes (`./uploads`)
- `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `CEREBRAS_API_KEY`: At least one provider key required
- `FIREBASE_SERVICE_ACCOUNT`: Single-line JSON credentials string (or place `firebase-service-account.json` in `backend/`)

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:
- `VITE_API_URL`: Backend `/api` base URL (e.g., `http://localhost:8000/api` for local dev; defaults to `https://prepmate-api-47v8.onrender.com/api` in production builds)
- `VITE_FIREBASE_*`: Firebase Web SDK configuration keys (`vercel.json` also proxies `/__/auth/*` and `/__/firebase/*` to `prepmateai-bac14.firebaseapp.com` so setting `VITE_FIREBASE_AUTH_DOMAIN=<your-vercel-domain>` works once `https://<your-vercel-domain>/__/auth/handler` is registered in Google Cloud OAuth Authorized Redirect URIs)

---

## Local Development & Verification

### Frontend
```bash
cd frontend
npm install
npm run dev          # Vite dev server
npx tsc --noEmit     # Strict TypeScript check
npm run build        # Typecheck + production bundle into frontend/dist
```

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Run backend checks:
```bash
cd backend
python -m unittest discover -s tests -v
python -m compileall -q app tests migrate_db.py
```

### Legacy Database Migration
If upgrading a pre-existing PostgreSQL database created before `parsed_text`, `analysis`, or `vocal_confidence_data` columns existed:
```bash
cd backend
python migrate_db.py
```

---

## License & Disclaimer
PrepMate AI is built for educational and interview preparation purposes. AI-generated scores and feedback simulate real-world interview evaluations and do not guarantee employment outcomes.
