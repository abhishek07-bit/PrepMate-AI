import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from app.resume.parser import extract_pdf_text, extract_skills
from app.services import ai_service
from app.services.ai_service import AIProviderError, AIResponse


class ResumeParserTests(unittest.TestCase):
    def test_extract_skills_avoids_substring_false_positives(self):
        text = "Built digital interfaces with JavaScript, TypeScript, React, and C++."
        skills = extract_skills(text)
        self.assertIn("JavaScript", skills)
        self.assertIn("TypeScript", skills)
        self.assertIn("React", skills)
        self.assertIn("C++", skills)
        self.assertNotIn("Java", skills)
        self.assertNotIn("Git", skills)

    def test_extract_pdf_text_handles_none_pages_and_strips_nul_bytes(self):
        mock_page_none = MagicMock()
        mock_page_none.extract_text.return_value = None
        mock_page_text = MagicMock()
        mock_page_text.extract_text.return_value = "Python\x00 FastAPI"

        mock_reader = MagicMock()
        mock_reader.pages = [mock_page_none, mock_page_text]

        with patch("app.resume.parser.PdfReader", return_value=mock_reader):
            extracted = extract_pdf_text(b"%PDF-mock")
        self.assertEqual(extracted.strip(), "Python FastAPI")
        self.assertNotIn("\x00", extracted)


class AIServiceTests(unittest.IsolatedAsyncioTestCase):
    def test_sanitize_pii_redacts_contact_info_and_keeps_urls(self):
        raw = "Jane Doe | jane.doe@example.com | +1 415-555-0199 | https://github.com/janedoe"
        cleaned = ai_service._sanitize_pii(raw)
        self.assertNotIn("jane.doe@example.com", cleaned)
        self.assertNotIn("415-555-0199", cleaned)
        self.assertIn("[EMAIL_REDACTED]", cleaned)
        self.assertIn("[PHONE_REDACTED]", cleaned)
        self.assertIn("https://github.com/janedoe", cleaned)

    def test_parse_json_response_strips_fences_and_prose(self):
        raw = "Here is the output:\n```json\n{\"score\": 88, \"feedback\": \"Solid\"}\n```\nDone."
        parsed = ai_service._parse_json_response(raw, expect_array=False)
        self.assertEqual(parsed["score"], 88)

    async def test_generate_fallback_counts_failures_accurately(self):
        failing_gemini = AsyncMock(side_effect=AIProviderError("gemini", "Rate limited"))
        succeeding_groq = AsyncMock(
            return_value=AIResponse(text="OK", provider="groq", model="m", latency_ms=10.0)
        )
        with patch.object(ai_service, "PROVIDER_STACK", [("gemini", failing_gemini), ("groq", succeeding_groq)]), \
             patch.object(ai_service, "_get_key_map", return_value={"gemini": "k1", "groq": "k2"}):
            resp = await ai_service.generate("hello")
        self.assertEqual(resp.provider, "groq")
        self.assertEqual(resp.fallback_count, 1)

    async def test_evaluate_answer_clamps_score_and_normalizes_lists(self):
        fake_resp = AIResponse(
            text='{"score": 145, "feedback": "Great", "strengths": "Clear", "improvements": null}',
            provider="gemini",
            model="m",
            latency_ms=5.0,
        )
        with patch.object(ai_service, "generate", AsyncMock(return_value=fake_resp)):
            result = await ai_service.evaluate_answer("Q?", "Ans", "SWE", "Acme", rigor_level=5, persona="challenging")
        self.assertEqual(result["score"], 100)
        self.assertEqual(result["strengths"], ["Clear"])
        self.assertEqual(result["improvements"], [])

    async def test_generate_session_feedback_handles_zero_answers(self):
        with patch.object(ai_service, "generate", AsyncMock()) as mock_gen:
            report = await ai_service.generate_session_feedback(
                [{"category": "Behavioral", "question": "Q1", "answer": "No answer provided.", "answered": False}],
                role="SWE",
                company="Google",
            )
        mock_gen.assert_not_called()
        self.assertEqual(report["overallScore"], 0)

    async def test_analyze_resume_raises_on_invalid_json(self):
        bad_resp = AIResponse(text="not json at all", provider="gemini", model="m", latency_ms=5.0)
        with patch.object(ai_service, "generate", AsyncMock(return_value=bad_resp)):
            with self.assertRaises(AIProviderError):
                await ai_service.analyze_resume("Resume text")

    async def test_analyze_resume_normalizes_missing_and_malformed_fields(self):
        partial = AIResponse(
            text='{"atsScore": "92", "weaknesses": "Missing metrics", "projects": "none"}',
            provider="gemini",
            model="m",
            latency_ms=5.0,
        )
        with patch.object(ai_service, "generate", AsyncMock(return_value=partial)):
            res = await ai_service.analyze_resume("Resume text")
        self.assertEqual(res["atsScore"], 92)
        self.assertEqual(res["impactScore"], 0)
        self.assertEqual(res["weaknesses"], ["Missing metrics"])
        self.assertEqual(res["projects"], [])

    async def test_generate_company_prep_normalizes_schema(self):
        partial = AIResponse(
            text='{"company": "Stripe", "description": "Practical", "corePhilosophy": [{"title": "Craft"}]}',
            provider="gemini",
            model="m",
            latency_ms=5.0,
        )
        with patch.object(ai_service, "generate", AsyncMock(return_value=partial)):
            prep = await ai_service.generate_company_prep("Stripe")
        self.assertEqual(prep["company"], "Stripe")
        self.assertEqual(prep["corePhilosophy"], [{"title": "Craft", "desc": "", "icon": "Brain"}])
        self.assertEqual(prep["targetedScenarios"], [])

    async def test_generate_interview_questions_fallback_returns_requested_count(self):
        bad_resp = AIResponse(text="corrupt output", provider="gemini", model="m", latency_ms=5.0)
        with patch.object(ai_service, "generate", AsyncMock(return_value=bad_resp)):
            qs = await ai_service.generate_interview_questions("Backend Engineer", "Stripe", "analytical", 4, ["Python"], num_questions=5)
        self.assertEqual(len(qs), 5)


if __name__ == "__main__":
    unittest.main()
