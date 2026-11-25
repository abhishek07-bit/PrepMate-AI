"""
PrepMate AI — Multi-Provider AI Service with Fallback Stack

Provider Priority (high performance -> low):
  1. Gemini 2.5 Flash     (Google — gemini-2.5-flash)
  2. Groq                 (Groq — openai/gpt-oss-120b)
  3. OpenRouter Gemini    (OpenRouter — google/gemini-2.5-flash)
  4. Cerebras             (Cerebras — qwen-3.8-27b)

Each provider implements the same interface. On failure (rate limit, timeout, error),
the system automatically falls through to the next provider.
"""

import json
import re
import time
import logging
import httpx
from typing import Any, Optional
from dataclasses import dataclass
from app.core.config import settings

logger = logging.getLogger("prepmate.ai")

_EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
_PHONE_RE = re.compile(r"(?<!\w)(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}(?!\w)")
_http_client: Optional[httpx.AsyncClient] = None


def _get_http_client() -> httpx.AsyncClient:
    """Return a shared connection-pooled AsyncClient for external AI requests."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=60.0)
    return _http_client


async def close_http_client() -> None:
    """Close the shared AsyncClient cleanly on application shutdown."""
    global _http_client
    if _http_client is not None and not _http_client.is_closed:
        await _http_client.aclose()
    _http_client = None


@dataclass
class AIResponse:
    text: str
    provider: str
    model: str
    latency_ms: float
    fallback_count: int = 0


class AIProviderError(Exception):
    def __init__(self, provider: str, message: str):
        self.provider = provider
        super().__init__(f"[{provider}] {message}")


def _sanitize_pii(text: str) -> str:
    """Redact obvious personal contact identifiers (emails/phones) before sending text to external LLMs."""
    cleaned = _EMAIL_RE.sub("[EMAIL_REDACTED]", text)
    cleaned = _PHONE_RE.sub("[PHONE_REDACTED]", cleaned)
    return cleaned


# ─────────────────────────────────────────────
# Provider Implementations
# ─────────────────────────────────────────────

async def _call_gemini(prompt: str, system_prompt: str = "", temperature: float = 0.7) -> AIResponse:
    """Google Gemini API (native REST — not OpenAI-compatible)."""
    start = time.monotonic()
    model = "gemini-2.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    payload: dict[str, Any] = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": 4096,
        },
    }
    if system_prompt:
        payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}

    headers = {
        "x-goog-api-key": settings.GEMINI_API_KEY,
        "Content-Type": "application/json",
    }

    client = _get_http_client()
    resp = await client.post(url, json=payload, headers=headers)
    if resp.status_code == 429:
        raise AIProviderError("gemini", "Rate limited (429)")
    if resp.status_code != 200:
        raise AIProviderError("gemini", f"HTTP {resp.status_code}: {resp.text[:200]}")

    try:
        data = resp.json()
    except ValueError:
        raise AIProviderError("gemini", f"Non-JSON HTTP 200 response: {resp.text[:200]}")
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError):
        raise AIProviderError("gemini", f"Unexpected response shape: {json.dumps(data)[:200]}")

    latency = (time.monotonic() - start) * 1000
    return AIResponse(text=text, provider="gemini", model=model, latency_ms=latency)


async def _call_openai_compatible(
    provider: str,
    url: str,
    api_key: str,
    model: str,
    prompt: str,
    system_prompt: str = "",
    temperature: float = 0.7,
    max_tokens: int = 4096,
    extra_headers: Optional[dict[str, str]] = None,
) -> AIResponse:
    """Shared client for OpenAI-compatible chat completions endpoints."""
    start = time.monotonic()
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        **(extra_headers or {}),
    }

    client = _get_http_client()
    resp = await client.post(url, json=payload, headers=headers)
    if resp.status_code == 429:
        raise AIProviderError(provider, "Rate limited (429)")
    if resp.status_code != 200:
        raise AIProviderError(provider, f"HTTP {resp.status_code}: {resp.text[:200]}")

    try:
        data = resp.json()
    except ValueError:
        raise AIProviderError(provider, f"Non-JSON HTTP 200 response: {resp.text[:200]}")
    try:
        text = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        raise AIProviderError(provider, f"Unexpected response shape: {json.dumps(data)[:200]}")

    latency = (time.monotonic() - start) * 1000
    return AIResponse(text=text, provider=provider, model=model, latency_ms=latency)


async def _call_groq(prompt: str, system_prompt: str = "", temperature: float = 0.7) -> AIResponse:
    """Groq API (OpenAI-compatible)."""
    return await _call_openai_compatible(
        provider="groq",
        url="https://api.groq.com/openai/v1/chat/completions",
        api_key=settings.GROQ_API_KEY,
        model="openai/gpt-oss-120b",
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=temperature,
        max_tokens=4096,
    )


async def _call_openrouter(prompt: str, system_prompt: str = "", temperature: float = 0.7) -> AIResponse:
    """OpenRouter API (OpenAI-compatible, routes to many models)."""
    return await _call_openai_compatible(
        provider="openrouter",
        url="https://openrouter.ai/api/v1/chat/completions",
        api_key=settings.OPENROUTER_API_KEY,
        model="google/gemini-2.5-flash",
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=temperature,
        max_tokens=2048,
        extra_headers={
            "HTTP-Referer": "https://prepmate.ai",
            "X-Title": "PrepMate AI",
        },
    )


async def _call_cerebras(prompt: str, system_prompt: str = "", temperature: float = 0.7) -> AIResponse:
    """Cerebras API (OpenAI-compatible, ultra-fast inference)."""
    return await _call_openai_compatible(
        provider="cerebras",
        url="https://api.cerebras.ai/v1/chat/completions",
        api_key=settings.CEREBRAS_API_KEY,
        model="qwen-3.8-27b",
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=temperature,
        max_tokens=4096,
    )


# ─────────────────────────────────────────────
# Fallback Stack Orchestrator
# ─────────────────────────────────────────────

PROVIDER_STACK = [
    ("gemini",      _call_gemini),
    ("groq",        _call_groq),
    ("openrouter",  _call_openrouter),
    ("cerebras",    _call_cerebras),
]


def _get_key_map() -> dict[str, str]:
    return {
        "gemini": settings.GEMINI_API_KEY,
        "groq": settings.GROQ_API_KEY,
        "openrouter": settings.OPENROUTER_API_KEY,
        "cerebras": settings.CEREBRAS_API_KEY,
    }


async def generate(
    prompt: str,
    system_prompt: str = "",
    temperature: float = 0.7,
    preferred_provider: Optional[str] = None,
) -> AIResponse:
    """
    Generate text using the AI fallback stack.
    Tries each configured provider in priority order until one succeeds.
    """
    stack = list(PROVIDER_STACK)
    if preferred_provider:
        stack = sorted(stack, key=lambda x: 0 if x[0] == preferred_provider else 1)

    key_map = _get_key_map()
    errors: list[AIProviderError] = []
    for name, call_fn in stack:
        if not key_map.get(name):
            continue

        try:
            logger.info(f"Trying provider: {name} (after {len(errors)} failures)")
            result = await call_fn(prompt, system_prompt, temperature)
            result.fallback_count = len(errors)
            if errors:
                logger.warning(
                    f"Used fallback provider '{name}' after {len(errors)} failures: {[e.provider for e in errors]}"
                )
            return result
        except (AIProviderError, httpx.TimeoutException, Exception) as e:
            logger.error(f"Provider '{name}' failed: {e}")
            errors.append(AIProviderError(name, str(e)))
            continue

    if not errors:
        raise AIProviderError("all", "No AI provider API keys configured.")

    error_details = "; ".join([f"{e.provider}: {e}" for e in errors])
    raise AIProviderError("all", f"All AI providers failed: {error_details}")


async def check_providers() -> dict:
    """Health check all providers. Returns status dict."""
    results = {}
    key_map = _get_key_map()
    for name, call_fn in PROVIDER_STACK:
        if not key_map.get(name):
            results[name] = {"status": "skipped", "reason": "no API key"}
            continue

        try:
            resp = await call_fn("Say OK", "", 0.1)
            results[name] = {
                "status": "ok",
                "model": resp.model,
                "latency_ms": round(resp.latency_ms, 1),
            }
        except Exception as e:
            results[name] = {"status": "error", "error": str(e)}

    return results


# ─────────────────────────────────────────────
# Domain-Specific Prompt Generators
# ─────────────────────────────────────────────

SYSTEM_PROMPT_INTERVIEWER = """You are an expert technical interviewer for top tech companies.
You generate interview questions that are challenging, specific, and tailored to the candidate's
experience and target role. Your questions should test both technical depth and communication ability.
Always respond with valid JSON when asked for structured output."""

SYSTEM_PROMPT_EVALUATOR = """You are an expert interview performance evaluator.
You analyze candidate responses with precision, identifying strengths and weaknesses.
You provide specific, actionable feedback. Be honest but constructive.
Always respond with valid JSON when asked for structured output."""


def _extract_json(text: str) -> str:
    """Strip markdown code fences and json prefixes from LLM outputs."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()
    return text


def _parse_json_response(text: str, expect_array: bool = False) -> Any:
    """Robustly extract and parse a JSON object or array from an LLM response."""
    cleaned = _extract_json(text)
    open_ch, close_ch = ("[", "]") if expect_array else ("{", "}")
    start_idx = cleaned.find(open_ch)
    end_idx = cleaned.rfind(close_ch)
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        return json.loads(cleaned[start_idx:end_idx + 1])
    return json.loads(cleaned)


def _coerce_score(value: Any, default: int = 0) -> int:
    try:
        return max(0, min(100, int(round(float(value)))))
    except (TypeError, ValueError):
        return default


def _coerce_str_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value if item is not None]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _coerce_dict_list(value: Any, required_keys: dict[str, str]) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    out = []
    for item in value:
        if isinstance(item, dict):
            normalized = {k: item.get(k, default) for k, default in required_keys.items()}
            out.append(normalized)
    return out


async def generate_interview_questions(
    role: str,
    company: str,
    persona: str,
    rigor_level: int,
    skills: list[str],
    num_questions: int = 5,
) -> list[dict]:
    """Generate tailored interview questions using AI."""
    skill_summary = ", ".join(skills[:15]) if skills else "General software engineering"
    prompt = f"""Generate exactly {num_questions} interview questions for a {role} position at {company}.

Interviewer persona: {persona}
Rigor level: {rigor_level}/5
Candidate skills: {skill_summary}

Return a JSON array where each item has:
- "category": one of "Behavioral", "Technical", "System Design", "Algorithms"
- "text": the main question text
- "sub_prompt": a follow-up guidance hint (1-2 sentences)
- "time_limit": suggested time in seconds (120-600)

Return ONLY the JSON array, no other text."""

    result = await generate(prompt, SYSTEM_PROMPT_INTERVIEWER, temperature=0.8)

    try:
        questions = _parse_json_response(result.text, expect_array=True)
        if isinstance(questions, list) and len(questions) > 0:
            return questions[:num_questions]
    except json.JSONDecodeError:
        logger.warning("Failed to parse interview questions JSON; falling back to default bank.")

    fallback_bank = [
        {
            "category": "Behavioral",
            "text": f"Walk me through the most impactful {role} project you led and the key trade-offs you made.",
            "sub_prompt": "Highlight measurable impact, ownership, and alternatives you considered.",
            "time_limit": 240,
        },
        {
            "category": "Technical",
            "text": f"Which technology from your background ({skill_summary}) is hardest to scale in production at {company}, and why?",
            "sub_prompt": "Discuss failure modes, monitoring, and performance bottlenecks.",
            "time_limit": 300,
        },
        {
            "category": "System Design",
            "text": f"Design a reliable, low-latency service tailored for {company}'s core users as a {role}.",
            "sub_prompt": "Clarify scale targets, storage choices, caching, and fault tolerance.",
            "time_limit": 420,
        },
        {
            "category": "Algorithms",
            "text": "How would you detect and resolve data skew or hot keys in a high-throughput distributed pipeline?",
            "sub_prompt": "Compare algorithmic and partitioning strategies along with time/space complexity.",
            "time_limit": 300,
        },
        {
            "category": "Behavioral",
            "text": "Tell me about a time you disagreed with a technical direction. How did you align the team?",
            "sub_prompt": "Use the STAR structure and focus on data-driven communication.",
            "time_limit": 240,
        },
    ]
    return fallback_bank[:num_questions]


async def evaluate_answer(
    question: str,
    answer: str,
    role: str,
    company: str,
    rigor_level: int = 3,
    persona: str = "analytical",
) -> dict:
    """Evaluate a candidate's answer using AI."""
    prompt = f"""Evaluate this interview answer for a {role} position at {company}.
Interviewer style: {persona}
Rigor level: {rigor_level}/5

Question: {question}
Candidate's Answer: {answer[:4000]}

Return a JSON object with:
- "score": integer 0-100 (Be critical and calibrate to rigor level {rigor_level}/5. 90+ is for exceptional, senior-level answers. 50-70 is average. <40 is weak.)
- "feedback": a 2-3 sentence evaluation
- "strengths": array of 1-3 strength points
- "improvements": array of 1-3 improvement suggestions

Return ONLY the JSON object."""

    result = await generate(prompt, SYSTEM_PROMPT_EVALUATOR, temperature=0.4)

    try:
        parsed = _parse_json_response(result.text, expect_array=False)
        if not isinstance(parsed, dict):
            raise ValueError("Expected JSON object")
        return {
            "score": _coerce_score(parsed.get("score", 0)),
            "feedback": str(parsed.get("feedback") or ""),
            "strengths": _coerce_str_list(parsed.get("strengths")),
            "improvements": _coerce_str_list(parsed.get("improvements")),
        }
    except (json.JSONDecodeError, ValueError, TypeError):
        logger.error(f"Failed to parse AI evaluation JSON. Raw text: {result.text[:200]}")
        raise AIProviderError("all", f"AI returned invalid JSON: {result.text[:100]}")


async def generate_session_feedback(
    questions_and_answers: list[dict],
    role: str,
    company: str,
    rigor_level: int = 3,
    persona: str = "analytical",
) -> dict:
    """Generate comprehensive session feedback."""
    answered_count = sum(1 for qa in questions_and_answers if qa.get("answered", True))
    if answered_count == 0:
        return {
            "overallScore": 0,
            "overallAssessment": "No questions were answered during this session, so a performance evaluation could not be completed.",
            "strengths": [
                {
                    "title": "Session Initiated",
                    "description": f"Configured a practice round for {role} at {company}.",
                }
            ],
            "improvements": [
                {
                    "title": "Submit Spoken or Written Responses",
                    "description": "Provide answers to each prompt before advancing so the evaluator can assess depth and clarity.",
                }
            ],
            "recommendedActions": [
                {"title": "Start a New Practice Interview", "link": "/interview/setup"},
                {"title": "Review Behavioral STAR Guide", "link": "/behavioral"},
            ],
            "vocalConfidenceData": [
                {"label": "Clarity", "value": 0},
                {"label": "Depth", "value": 0},
                {"label": "Pacing", "value": 0},
                {"label": "Structure", "value": 0},
                {"label": "Composure", "value": 0},
            ],
        }

    qa_text = "\n\n".join([
        (
            f"Q{i+1} [{qa['category']}]: {qa['question']}\n"
            f"A (confidence={qa.get('confidence', 'unknown')}, duration={qa.get('duration', 0)}s, item_score={qa.get('score', 'n/a')}): "
            f"{qa['answer']}"
        )
        for i, qa in enumerate(questions_and_answers)
    ])

    prompt = f"""Analyze this complete mock interview session for a {role} position at {company}.
Interviewer style: {persona}
Rigor level: {rigor_level}/5

{qa_text}

Return a JSON object with:
- "overallScore": integer 0-100 (Calculate realistically based on individual answers, rigor level {rigor_level}/5, and communication quality.)
- "overallAssessment": 2-3 sentence overall evaluation
- "strengths": array of objects with "title" and "description" (3 items)
- "improvements": array of objects with "title" and "description" (3 items)
- "recommendedActions": array of objects with "title" and "link" (2 items; valid app routes like "/interview/setup", "/system-design", "/behavioral", or "/resume")
- "vocalConfidenceData": array of objects with "label" and "value" (5 data points reflecting communication clarity, structure, confidence, pacing, and technical composure, values 0-100)

Return ONLY the JSON object."""

    result = await generate(prompt, SYSTEM_PROMPT_EVALUATOR, temperature=0.5)

    try:
        parsed = _parse_json_response(result.text, expect_array=False)
        if not isinstance(parsed, dict):
            raise ValueError("Expected JSON object")
        vocal_raw = parsed.get("vocalConfidenceData")
        vocal_clean = []
        if isinstance(vocal_raw, list):
            for entry in vocal_raw:
                if isinstance(entry, dict):
                    vocal_clean.append({
                        "label": str(entry.get("label") or "Metric"),
                        "value": _coerce_score(entry.get("value", 0)),
                    })
        return {
            "overallScore": _coerce_score(parsed.get("overallScore", 0)),
            "overallAssessment": str(parsed.get("overallAssessment") or ""),
            "strengths": _coerce_dict_list(parsed.get("strengths"), {"title": "", "description": ""}),
            "improvements": _coerce_dict_list(parsed.get("improvements"), {"title": "", "description": ""}),
            "recommendedActions": _coerce_dict_list(parsed.get("recommendedActions"), {"title": "", "link": "/interview/setup"}),
            "vocalConfidenceData": vocal_clean,
        }
    except (json.JSONDecodeError, ValueError, TypeError):
        logger.error(f"Failed to parse session feedback JSON. Raw text: {result.text[:200]}")
        raise AIProviderError("all", f"AI failed to generate session feedback: {result.text[:100]}")


async def analyze_resume(resume_text: str) -> dict:
    """Analyze a resume and provide comprehensive feedback including LaTeX checks."""
    sanitized_text = _sanitize_pii(resume_text[:5000])
    prompt = f"""Act as a Ruthless, World-Class FAANG Recruiter and ATS Optimization Expert.
    Your goal is to tear this resume apart and find EVERY single flaw.

    SPECIAL INSTRUCTION: Analyze the document's structure. If it appears to be a LaTeX-generated resume, evaluate if the LaTeX-to-PDF conversion has preserved text-searchable layers or if it has created non-standard character encoding that breaks ATS.

    Resume Text:
    {sanitized_text}

    Return a JSON object STRICTLY matching this format:
    {{
        "atsScore": integer (0-100),
        "impactScore": integer (0-100),
        "brevityScore": integer (0-100),
        "latexStructureScore": integer (0-100),
        "overallSummary": string,
        "voiceSummary": string,
        "strengths": [array of string],
        "weaknesses": [array of string],
        "metricsDetected": [array of string],
        "allLinksFound": [array of strings (portfolio/GitHub/project URLs found in the text)],
        "projects": [
            {{
                "name": string,
                "github": string (URL or "Not Found"),
                "live": string (URL or "Not Found"),
                "stack": string,
                "impact": string (1-sentence quantified achievement)
            }}
        ],
        "recommendedRoles": [array of string],
        "criticalFixes": [array of string]
    }}

    Return ONLY the raw JSON string."""

    result = await generate(prompt, SYSTEM_PROMPT_INTERVIEWER, temperature=0.2)
    try:
        parsed = _parse_json_response(result.text, expect_array=False)
        if not isinstance(parsed, dict):
            raise ValueError("Expected JSON object")
        return {
            "atsScore": _coerce_score(parsed.get("atsScore", 0)),
            "impactScore": _coerce_score(parsed.get("impactScore", 0)),
            "brevityScore": _coerce_score(parsed.get("brevityScore", 0)),
            "latexStructureScore": _coerce_score(parsed.get("latexStructureScore", 0)),
            "overallSummary": str(parsed.get("overallSummary") or ""),
            "voiceSummary": str(parsed.get("voiceSummary") or ""),
            "strengths": _coerce_str_list(parsed.get("strengths")),
            "weaknesses": _coerce_str_list(parsed.get("weaknesses")),
            "metricsDetected": _coerce_str_list(parsed.get("metricsDetected")),
            "allLinksFound": _coerce_str_list(parsed.get("allLinksFound")),
            "projects": _coerce_dict_list(
                parsed.get("projects"),
                {"name": "", "github": "Not Found", "live": "Not Found", "stack": "", "impact": ""},
            ),
            "recommendedRoles": _coerce_str_list(parsed.get("recommendedRoles")),
            "criticalFixes": _coerce_str_list(parsed.get("criticalFixes")),
        }
    except (json.JSONDecodeError, ValueError):
        logger.error(f"Failed to parse resume analysis JSON. Raw text: {result.text[:200]}")
        raise AIProviderError("all", "Failed to parse resume analysis JSON from AI provider")


async def analyze_job_match(resume_text: str, job_description: str) -> dict:
    """Perform 'Kill-Ratio' analysis between a resume and a specific job description."""
    sanitized_resume = _sanitize_pii(resume_text[:4000])
    prompt = f"""Act as a Ruthless FAANG Hiring Manager. Compare this RESUME against the JOB DESCRIPTION.
    Calculate the 'Kill-Ratio' (Probability of immediate rejection).

    JOB DESCRIPTION:
    {job_description[:3000]}

    RESUME TEXT:
    {sanitized_resume}

    Return a JSON object:
    {{
        "rejectionProbability": integer (0-100, higher means more likely to be rejected),
        "matchScore": integer (0-100),
        "topRejectionReasons": [array of 3 brutally honest reasons why this resume would be rejected for THIS specific job],
        "gapReport": [array of objects with "missingSkill", "importance" (High/Medium), "fixAction"],
        "killRatioVerdict": string (A ruthless, 1-sentence verdict on the candidate's chances)
    }}

    Return ONLY the raw JSON string."""

    result = await generate(prompt, SYSTEM_PROMPT_INTERVIEWER, temperature=0.2)
    try:
        parsed = _parse_json_response(result.text, expect_array=False)
        if not isinstance(parsed, dict):
            raise ValueError("Expected JSON object")
        return {
            "rejectionProbability": _coerce_score(parsed.get("rejectionProbability", 0)),
            "matchScore": _coerce_score(parsed.get("matchScore", 0)),
            "topRejectionReasons": _coerce_str_list(parsed.get("topRejectionReasons")),
            "gapReport": _coerce_dict_list(
                parsed.get("gapReport"),
                {"missingSkill": "", "importance": "Medium", "fixAction": ""},
            ),
            "killRatioVerdict": str(parsed.get("killRatioVerdict") or ""),
        }
    except (json.JSONDecodeError, ValueError):
        logger.error(f"Failed to parse job match JSON. Raw text: {result.text[:200]}")
        raise AIProviderError("all", "Failed to perform job match analysis from AI provider")


async def generate_company_prep(company_name: str) -> dict:
    """Generate targeted company interview prep guide."""
    clean_company = company_name.strip()[:120]
    prompt = f"""Create a targeted interview preparation guide for the company named: {json.dumps(clean_company)}.

Return a JSON object with:
- "company": string (the company name)
- "description": string (1-2 sentences summarizing the interview style)
- "corePhilosophy": array of 3 objects, each with "title", "desc" (description), and "icon" (string name of a Lucide icon like 'Brain', 'Code', 'Globe', 'Target', 'Zap')
- "targetedScenarios": array of 3-4 objects, each with "title", "category" (e.g. 'System Design', 'Behavioral'), "time" (e.g. '45 mins'), and "desc" (brief description of what it assesses)

Return ONLY the JSON object."""

    result = await generate(prompt, SYSTEM_PROMPT_INTERVIEWER, temperature=0.7)
    try:
        parsed = _parse_json_response(result.text, expect_array=False)
        if not isinstance(parsed, dict):
            raise ValueError("Expected JSON object")
        return {
            "company": str(parsed.get("company") or clean_company),
            "description": str(parsed.get("description") or ""),
            "corePhilosophy": _coerce_dict_list(
                parsed.get("corePhilosophy"),
                {"title": "", "desc": "", "icon": "Brain"},
            ),
            "targetedScenarios": _coerce_dict_list(
                parsed.get("targetedScenarios"),
                {"title": "", "category": "Technical", "time": "45 mins", "desc": ""},
            ),
        }
    except (json.JSONDecodeError, ValueError):
        raise AIProviderError("all", "Failed to parse company prep JSON")


