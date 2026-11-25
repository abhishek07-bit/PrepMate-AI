# PrepMate AI

**PrepMate AI** is a full-stack, adaptive AI interview preparation platform built with **React 19 + TypeScript + Vite 8** on the frontend and **FastAPI + SQLAlchemy + PostgreSQL/SQLite** on the backend, backed by a 4-provider LLM fallback stack and Firebase/JWT authentication.

- **Live Web App (Vercel):** https://prepmatethree-ai.vercel.app/
- **Backend API (Render):** https://prepmate-api-47v8.onrender.com

---

## Repository Structure

```text
PrepMate-AI/
├── .github/workflows/
│   └── keep-alive.yml       # Scheduled 10-minute ping to Render /api/health
├── .gitignore
├── README.md                # Root repository guide
└── web/
    ├── package.json         # Convenience scripts delegating to frontend/
    ├── vercel.json          # Vercel config (when Root Directory = web/)
    ├── README.md            # Detailed web application architecture & API docs
    ├── backend/             # FastAPI API, SQLAlchemy models, AI service, tests
    └── frontend/            # React 19 + TypeScript + Vite 8 + Tailwind CSS SPA
```

---

## Key Capabilities

- **Resume Audit & Job Match ("Kill-Ratio")**: Upload `.pdf` or `.docx` resumes, extract technical skills with token-boundary matching, run ATS/impact/brevity/LaTeX structure audits (with email/phone PII redaction before external LLM calls), and compare resumes against target job descriptions.
- **Personalized Mock Interviews**: Configure role, target company, interviewer style (`analytical`, `challenging`, `conversational`), and difficulty (`1–5`), automatically pulling skills from your latest uploaded resume and settings preferences.
- **Voice-Enabled Interview Room**: Text-to-Speech (`SpeechSynthesis`) question playback and Web Speech API (`SpeechRecognition`) dictation with iOS Safari compatibility, timing HUD, per-question evaluation, and comprehensive session feedback reports.
- **Company Preparation**: On-demand company interview philosophy and targeted practice scenarios with direct jump links into practice setup and 1-hour server TTL caching.
- **Progress & Analytics**: Tracks readiness score, weekly trends, score stability, practice duration, role breakdown, and category weakness focus areas across completed sessions.
- **Multi-Provider AI Fallback Stack**: Automatically falls back across **Gemini 2.5 Flash** → **Groq (`openai/gpt-oss-120b`)** → **OpenRouter (`google/gemini-2.5-flash`)** → **Cerebras (`qwen-3.8-27b`)**.

---

## Quick Start

### 1. Backend (`web/backend`)
```bash
cd web/backend
python -m venv venv
# Windows: venv\Scripts\activate  |  macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### 2. Frontend (`web/frontend`)
```bash
cd web/frontend
npm install
cp .env.example .env
npm run dev
```

Or from `web/`:
```bash
npm run install-frontend
npm run dev
```

---

## Verification & Testing

- **Backend unit & API tests**:
  ```bash
  cd web/backend
  python -m unittest discover -s tests -v
  python -m compileall -q app tests migrate_db.py
  ```
- **Frontend strict typecheck & production build**:
  ```bash
  cd web/frontend
  npx tsc --noEmit
  npm run build
  ```

---

## Deployment & Keep-Alive

- **Frontend**: Deployed on Vercel via `web/frontend/vercel.json` (or `web/vercel.json` if Root Directory is `web/`).
- **Backend**: Deployed on Render via `web/backend/render.yaml` (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
- **Keep-Alive Cron**: [.github/workflows/keep-alive.yml](.github/workflows/keep-alive.yml) pings `https://prepmate-api-47v8.onrender.com/api/health` every 10 minutes (`*/10 * * * *`) and supports manual triggering via `workflow_dispatch`.

See [web/README.md](web/README.md) for full API routes, database schema, and environment configuration details.
