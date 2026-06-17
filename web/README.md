# PrepMate AI — Master the Interview with Quiet Intelligence

**PrepMate AI** is an adaptive, AI-powered interview preparation platform designed to simulate realistic technical and HR interviews. Unlike traditional tools that rely on static question banks, PrepMate AI behaves like a real interviewer—analyzing your profile, asking intelligent follow-up questions, and dynamically adapting to your performance in real-time.

---

## ✨ What's New
- **Custom "Pebble" Typography:** Integrated the premium **Aerodome** font for a distinct, high-end brand identity.
- **Animated Lottie Identity:** A permanent looping SVG animation in the navigation bar for a modern, "alive" feel.
- **Glow Design System:** Replaced standard pill-style badges with a clean "glow" pattern featuring pulse dots, gradient underlines, and expanded tracking.
- **Multi-Provider AI Fallback:** Orchestrates requests across Gemini 2.0, Groq Llama 3.3, and OpenRouter to ensure 99.9% availability.
- **Neural Load Tracking:** Real-time calculation of cognitive load based on answer complexity and duration.

---

## 🚀 Key Features

*   **Dynamic Follow-up Questioning:** Simulates real-world conversations by digging deeper into your previous answers.
*   **Adaptive Interview Difficulty:** The platform automatically adjusts based on your skill level and real-time performance.
*   **Weakness Memory Engine:** Tracks recurring mistakes and technical gaps over time to provide focused coaching.
*   **ATS Matching (Kill-Ratio Analysis):** Paste a job description and get a "Ruthless FAANG Hiring Manager" evaluation of your resume's chances.
*   **Voice Integration:** Real-time Text-to-Speech (TTS) for questions and Speech-to-Text (STT) for capturing your responses.
*   **Company-Specific Modes:** Tailor your preparation for specific roles at companies like Google, Meta, or Amazon.

---

## 🏗️ Architecture

```text
.
├── frontend/          # React 19 + TypeScript + Vite 8
│   ├── src/
│   │   ├── api/       # Axios client with Multi-Provider logic
│   │   ├── components/ # Custom "Pebble" UI components & Lottie animations
│   │   ├── store/     # Zustand state (Auth, Interview, Analytics)
│   │   ├── styles/    # Tailwind CSS + Custom @font-face
│   │   └── pages/     # Dashboard, Mock Interview, Resume Audit, Analytics, etc.
│   └── ...
│
├── backend/           # FastAPI + SQLAlchemy + PostgreSQL
│   ├── app/
│   │   ├── api/       # Interview logic & Session management
│   │   ├── auth/      # JWT & Firebase hybrid authentication
│   │   ├── analytics/ # Real-time performance tracking
│   │   ├── resume/    # PDF/DOCX Parsing & AI Skill Extraction
│   │   └── services/  # AI Service (Gemini, Groq, OpenRouter, Cerebras)
│   └── ...
```

---

## 💻 Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion, GSAP, Lottie.
- **State:** Zustand (with persistence).
- **Backend:** Python, FastAPI, SQLAlchemy.
- **Database:** PostgreSQL (Supabase) / SQLite.
- **AI Layers:** Google Gemini 2.0 Flash (Primary), Groq Llama 3.3, OpenRouter, Cerebras.
- **Auth:** Firebase Auth + Custom JWT.

---

## 🔄 Core Workflow

1.  **Resume Audit:** Upload your resume for a "Ruthless Audit" and ATS score.
2.  **Setup:** Configure your target role, company, and interviewer persona.
3.  **Interview:** Engage in a voice-enabled mock interview with adaptive questioning.
4.  **Feedback:** Receive a comprehensive report with a Readiness Score and "Neural Load" metrics.
5.  **Analytics:** Track your progress over time via a dedicated performance heatmap.

---

## ⚖️ License & Terms
PrepMate AI is intended for educational purposes. All AI-generated content is intended to simulate real-world scenarios and does not guarantee job offers or specific outcomes.

---

## ⚡ Setup

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---
*Built for the next generation of engineers. Master the interview with PrepMate AI.*
