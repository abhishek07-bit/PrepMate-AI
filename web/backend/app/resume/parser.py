import io
import re
from pypdf import PdfReader

COMMON_SKILLS = [
    "Python", "Java", "C++", "C#", "JavaScript", "TypeScript", "React", "Angular", "Vue",
    "Node.js", "Express", "Django", "FastAPI", "Flask", "Spring Boot", "Ruby on Rails",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "Jenkins", "Git",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Computer Vision",
    "System Design", "Microservices", "REST API", "GraphQL", "Agile", "Scrum",
    "HTML", "CSS", "SASS", "Tailwind", "Next.js", "Nuxt.js", "Redux", "Zustand",
]

SKILL_PATTERNS = [
    (skill, re.compile(rf"(?<![A-Za-z0-9]){re.escape(skill)}(?![A-Za-z0-9])", re.IGNORECASE))
    for skill in COMMON_SKILLS
]


def extract_pdf_text(b_content: bytes) -> str:
    """Extract text from PDF bytes safely even when pages return None or NUL bytes."""
    reader = PdfReader(io.BytesIO(b_content))
    text = " ".join((page.extract_text() or "") for page in reader.pages)
    return text.replace("\x00", "")


def extract_docx_text(b_content: bytes) -> str:
    """Extract text from DOCX paragraphs and tables, stripping NUL bytes."""
    from docx import Document

    doc = Document(io.BytesIO(b_content))
    parts = [p.text for p in doc.paragraphs if p.text]
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if cell.text:
                    parts.append(cell.text)
    return " ".join(parts).replace("\x00", "")


def extract_skills(text: str) -> list[str]:
    """Match technical skills using token boundaries to avoid substring false positives."""
    if not text:
        return []
    return sorted({
        skill for skill, pattern in SKILL_PATTERNS if pattern.search(text)
    })
