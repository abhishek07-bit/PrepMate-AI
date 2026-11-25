import io
import os
import tempfile
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

try:
    from docx import Document
    from fastapi.testclient import TestClient
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    HAS_INTEGRATION_DEPS = True
except ImportError:
    HAS_INTEGRATION_DEPS = False


def _make_docx_bytes(paragraphs: list[str], table_rows: list[list[str]] | None = None) -> bytes:
    doc = Document()
    for p in paragraphs:
        doc.add_paragraph(p)
    if table_rows:
        table = doc.add_table(rows=len(table_rows), cols=len(table_rows[0]))
        for r_idx, row in enumerate(table_rows):
            for c_idx, cell_text in enumerate(row):
                table.cell(r_idx, c_idx).text = cell_text
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


@unittest.skipUnless(HAS_INTEGRATION_DEPS, "Full backend dependencies not installed in current Python")
class FastAPIEndToEndTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmpdir = tempfile.TemporaryDirectory()
        cls.db_path = os.path.join(cls.tmpdir.name, "test_prepmate.db")
        cls.upload_dir = os.path.join(cls.tmpdir.name, "uploads")

        # Override any local .env DATABASE_URL (e.g. Postgres) before importing app.db.database
        cls._prev_database_url = os.environ.get("DATABASE_URL")
        os.environ["DATABASE_URL"] = f"sqlite:///{cls.db_path}"

        from app.core.config import settings
        cls._prev_settings_db_url = settings.DATABASE_URL
        settings.DATABASE_URL = f"sqlite:///{cls.db_path}"
        from app.db.database import Base, get_db
        from app.main import app

        settings.UPLOAD_DIR = cls.upload_dir
        cls.engine = create_engine(f"sqlite:///{cls.db_path}", connect_args={"check_same_thread": False})
        cls.TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        Base.metadata.create_all(bind=cls.engine)

        def override_get_db():
            db = cls.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        cls.app = app
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        from app.core.config import settings
        settings.DATABASE_URL = cls._prev_settings_db_url
        cls.app.dependency_overrides.clear()
        cls.engine.dispose()
        cls.tmpdir.cleanup()
        if cls._prev_database_url is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = cls._prev_database_url

    def setUp(self):
        from app.db.database import Base
        Base.metadata.drop_all(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)

    def _register_and_headers(self, email="alice@example.com", password="Password123", first="Alice", last="Ng"):
        resp = self.client.post(
            "/api/auth/register",
            json={"email": email, "password": password, "firstName": first, "lastName": last},
        )
        self.assertEqual(resp.status_code, 200, resp.text)
        data = resp.json()
        return {"Authorization": f"Bearer {data['access_token']}"}, data["user"]

    def test_health_and_passive_ai_status(self):
        self.assertEqual(self.client.get("/").status_code, 200)
        self.assertEqual(self.client.get("/api/health").json(), {"status": "healthy"})

        status = self.client.get("/api/ai/status")
        self.assertEqual(status.status_code, 200)
        self.assertIn("stack_order", status.json())

        # Live probe must require auth
        self.assertEqual(self.client.get("/api/ai/status/probe").status_code, 401)

    def test_auth_validation_profile_and_firebase_verified_guard(self):
        # Bad email & weak password
        r_bad_email = self.client.post(
            "/api/auth/register",
            json={"email": "not-an-email", "password": "Password1", "firstName": "A", "lastName": "B"},
        )
        self.assertEqual(r_bad_email.status_code, 400)

        r_weak_pw = self.client.post(
            "/api/auth/register",
            json={"email": "a@example.com", "password": "short", "firstName": "A", "lastName": "B"},
        )
        self.assertEqual(r_weak_pw.status_code, 400)

        headers, user = self._register_and_headers()
        self.assertTrue(user["createdAt"].endswith("+00:00"))

        # Login & duplicate check
        r_dup = self.client.post(
            "/api/auth/register",
            json={"email": "ALICE@example.com", "password": "Password123", "firstName": "Alice", "lastName": "Ng"},
        )
        self.assertEqual(r_dup.status_code, 400)

        r_login = self.client.post("/api/auth/login", json={"email": "ALICE@example.com", "password": "Password123"})
        self.assertEqual(r_login.status_code, 200)

        # Profile update
        r_upd = self.client.put("/api/auth/update-profile", headers=headers, json={"firstName": "Alicia", "lastName": "Ng"})
        self.assertEqual(r_upd.status_code, 200)
        self.assertEqual(r_upd.json()["firstName"], "Alicia")
        self.assertEqual(self.client.get("/api/auth/me", headers=headers).json()["firstName"], "Alicia")

        # Unverified Firebase token colliding with existing email must be rejected (403)
        fake_firebase_auth = MagicMock()
        fake_firebase_auth.verify_id_token.return_value = {
            "uid": "fb-attacker-uid",
            "email": "alice@example.com",
            "email_verified": False,
        }
        with patch("app.auth.routes._is_firebase_initialized", return_value=True), \
             patch("firebase_admin.auth", fake_firebase_auth, create=True):
            r_unverified = self.client.get("/api/auth/me", headers={"Authorization": "Bearer fb-token"})
        self.assertEqual(r_unverified.status_code, 403)

    def test_resume_upload_traversal_safety_analysis_and_delete(self):
        headers, _ = self._register_and_headers()
        other_headers, _ = self._register_and_headers(email="bob@example.com")

        # Reject unsupported extension
        r_txt = self.client.post(
            "/api/resume/upload",
            headers=headers,
            files={"file": ("notes.txt", b"hello", "text/plain")},
        )
        self.assertEqual(r_txt.status_code, 400)

        # Upload real DOCX with traversal filename and table skills
        docx_bytes = _make_docx_bytes(
            ["Senior JavaScript and React engineer building FastAPI microservices."],
            table_rows=[["Docker", "PostgreSQL"]],
        )
        r_up = self.client.post(
            "/api/resume/upload",
            headers=headers,
            files={"file": ("../../evil_resume.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )
        self.assertEqual(r_up.status_code, 200, r_up.text)
        uploaded = r_up.json()
        self.assertEqual(uploaded["fileName"], "evil_resume.docx")
        self.assertIn("JavaScript", uploaded["skills"])
        self.assertIn("FastAPI", uploaded["skills"])
        self.assertIn("Docker", uploaded["skills"])
        self.assertNotIn("Java", uploaded["skills"])
        resume_id = uploaded["id"]

        # Verify file was safely stored inside upload_dir with UUID name
        stored_files = os.listdir(self.upload_dir)
        self.assertEqual(len(stored_files), 1)
        self.assertNotIn("evil_resume", stored_files[0])

        # Rehydrate via /latest
        r_latest = self.client.get("/api/resume/latest", headers=headers)
        self.assertEqual(r_latest.status_code, 200)
        self.assertEqual(r_latest.json()["resume"]["id"], resume_id)

        # Other user cannot analyze or delete Alice's resume
        self.assertEqual(self.client.post(f"/api/resume/analyze/{resume_id}", headers=other_headers).status_code, 404)
        self.assertEqual(self.client.delete(f"/api/resume/{resume_id}", headers=other_headers).status_code, 404)

        # Analyze & cache
        mock_analysis = {
            "atsScore": 84,
            "impactScore": 79,
            "brevityScore": 88,
            "latexStructureScore": 75,
            "overallSummary": "Strong engineering resume.",
            "voiceSummary": "Strong summary.",
            "strengths": ["Clear metrics"],
            "weaknesses": ["Add system scale"],
            "metricsDetected": ["35% latency drop"],
            "allLinksFound": [],
            "projects": [],
            "recommendedRoles": ["Senior Frontend Engineer"],
            "criticalFixes": ["Quantify leadership"],
        }
        with patch("app.resume.routes.analyze_resume", AsyncMock(return_value=mock_analysis)) as mock_an:
            r_an1 = self.client.post(f"/api/resume/analyze/{resume_id}", headers=headers)
            r_an2 = self.client.post(f"/api/resume/analyze/{resume_id}", headers=headers)
        self.assertEqual(r_an1.status_code, 200)
        self.assertEqual(r_an2.json()["atsScore"], 84)
        self.assertEqual(mock_an.await_count, 1)  # Second call used DB cache

        # Job match
        mock_match = {
            "rejectionProbability": 22,
            "matchScore": 86,
            "topRejectionReasons": ["No Kubernetes listed"],
            "gapReport": [{"missingSkill": "Kubernetes", "importance": "Medium", "fixAction": "Add cluster work"}],
            "killRatioVerdict": "Strong fit.",
        }
        with patch("app.resume.routes.analyze_job_match", AsyncMock(return_value=mock_match)):
            r_match = self.client.post(
                f"/api/resume/match/{resume_id}",
                headers=headers,
                json={"jobDescription": "Looking for React and FastAPI engineer."},
            )
        self.assertEqual(r_match.status_code, 200)
        self.assertEqual(r_match.json()["matchScore"], 86)

        # Delete resume removes DB row and disk file
        r_del = self.client.delete(f"/api/resume/{resume_id}", headers=headers)
        self.assertEqual(r_del.status_code, 200)
        self.assertEqual(os.listdir(self.upload_dir), [])
        self.assertIsNone(self.client.get("/api/resume/latest", headers=headers).json()["resume"])

    def test_interview_full_lifecycle_analytics_and_account_erasure(self):
        headers, _ = self._register_and_headers()

        # Upload resume so setup falls back to extracted skills
        docx_bytes = _make_docx_bytes(["Expert in Python, FastAPI, PostgreSQL, and System Design."])
        self.client.post(
            "/api/resume/upload",
            headers=headers,
            files={"file": ("cv.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )

        # Setup failure cleans up orphaned session
        with patch("app.services.ai_service.generate_interview_questions", AsyncMock(side_effect=RuntimeError("AI down"))):
            with self.assertRaises(RuntimeError):
                self.client.post(
                    "/api/interview/setup",
                    headers=headers,
                    json={"role": "Backend Engineer", "company": "Stripe", "persona": "analytical", "rigorLevel": 4},
                )
        self.assertEqual(self.client.get("/api/analytics/history?include_incomplete=true", headers=headers).json(), [])

        # Successful setup pulls resume skills automatically
        fake_questions = [
            {"category": "Technical", "text": "Explain connection pooling.", "sub_prompt": "Mention PgBouncer.", "time_limit": "300"},
            {"category": "System Design", "text": "Design idempotent payments.", "sub_prompt": "Use keys.", "time_limit": 420},
        ]
        with patch("app.services.ai_service.generate_interview_questions", AsyncMock(return_value=fake_questions)) as mock_gq:
            r_setup = self.client.post(
                "/api/interview/setup",
                headers=headers,
                json={"role": "Backend Engineer", "company": "Stripe", "persona": "analytical", "rigorLevel": 4},
            )
        self.assertEqual(r_setup.status_code, 200)
        passed_skills = mock_gq.call_args.kwargs["skills"]
        self.assertIn("Python", passed_skills)
        session_id = r_setup.json()["sessionId"]

        # Incomplete session hidden from default /history
        self.assertEqual(self.client.get("/api/analytics/history", headers=headers).json(), [])

        # Fetch questions & submit idempotent answer
        qs = self.client.get(f"/api/interview/{session_id}/questions", headers=headers).json()
        self.assertEqual(len(qs), 2)
        q1_id = qs[0]["id"]

        with patch("app.services.ai_service.evaluate_answer", AsyncMock(return_value={"score": 70, "feedback": "Good", "strengths": [], "improvements": []})):
            self.client.post(f"/api/interview/answer/{q1_id}", headers=headers, json={"text": "First draft", "confidence": "medium", "duration": 65})
        with patch("app.services.ai_service.evaluate_answer", AsyncMock(return_value={"score": 82, "feedback": "Much better", "strengths": [], "improvements": []})):
            r_ans = self.client.post(f"/api/interview/answer/{q1_id}", headers=headers, json={"text": "Improved answer", "confidence": "high", "duration": 90})
        self.assertEqual(r_ans.json()["score"], 82)

        # Generate feedback & verify cached second call
        fake_report = {
            "overallScore": 82,
            "overallAssessment": "Solid technical mastery.",
            "strengths": [{"title": "Pooling", "description": "Clear explanation"}],
            "improvements": [{"title": "Scale", "description": "Add numbers"}],
            "recommendedActions": [{"title": "Practice System Design", "link": "/system-design"}],
            "vocalConfidenceData": [{"label": "Clarity", "value": 85}],
        }
        with patch("app.services.ai_service.generate_session_feedback", AsyncMock(return_value=fake_report)) as mock_fb:
            r_fb1 = self.client.get(f"/api/interview/{session_id}/feedback", headers=headers)
            r_fb2 = self.client.get(f"/api/interview/{session_id}/feedback", headers=headers)
        self.assertEqual(r_fb1.status_code, 200)
        self.assertEqual(r_fb2.json()["overallScore"], 82)
        self.assertEqual(mock_fb.await_count, 1)

        # History & readiness & weaknesses reflect completed session (duration = 90s)
        hist = self.client.get("/api/analytics/history", headers=headers).json()
        self.assertEqual(len(hist), 1)
        self.assertEqual(hist[0]["duration"], 90)
        self.assertEqual(self.client.get("/api/analytics/readiness", headers=headers).json()["readinessScore"], 82)
        self.assertEqual(self.client.get("/api/analytics/weaknesses", headers=headers).json()["topics"][0]["name"], "All Good")

        # Company prep caches cleanly
        fake_prep = {
            "company": "Stripe",
            "description": "API craft.",
            "corePhilosophy": [{"title": "Users First", "desc": "Focus", "icon": "Target"}],
            "targetedScenarios": [{"title": "API Design", "category": "Technical", "time": "45m", "desc": "Build API"}],
        }
        with patch("app.services.ai_service.generate_company_prep", AsyncMock(return_value=fake_prep)) as mock_cp:
            r_cp1 = self.client.get("/api/interview/company/Stripe", headers=headers)
            r_cp2 = self.client.get("/api/interview/company/stripe", headers=headers)
        self.assertEqual(r_cp1.status_code, 200)
        self.assertFalse(r_cp2.json()["isFallback"])
        self.assertEqual(mock_cp.await_count, 1)

        # Delete account deletes everything cleanly
        self.assertEqual(self.client.delete("/api/auth/me", headers=headers).status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me", headers=headers).status_code, 401)
        self.assertEqual(os.listdir(self.upload_dir), [])


if __name__ == "__main__":
    unittest.main()
