import json
import os
import re
from typing import Any

import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()
app = FastAPI(title="Kairos AI Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

FIELD_DATA = {
    "Data Science": {
        "keywords": ["tensorflow", "keras", "pytorch", "machine learning", "deep learning", "flask", "streamlit"],
        "skills": ["Data Visualization", "Predictive Analysis", "Statistical Modeling", "Data Mining", "Clustering & Classification", "Data Analytics", "ML Algorithms", "Scikit-learn", "TensorFlow", "PyTorch", "Probability"],
        "courses": [
            ["Machine Learning Crash Course by Google [Free]", "https://developers.google.com/machine-learning/crash-course"],
            ["Machine Learning A-Z by Udemy", "https://www.udemy.com/course/machinelearning/"],
            ["Machine Learning by Andrew Ng", "https://www.coursera.org/learn/machine-learning"],
            ["Data Scientist with Python", "https://www.datacamp.com/tracks/data-scientist-with-python"],
            ["Programming for Data Science with Python", "https://www.udacity.com/course/programming-for-data-science-nanodegree--nd104"],
        ],
    },
    "Web Development": {
        "keywords": ["react", "django", "node js", "node.js", "react js", "php", "laravel", "magento", "wordpress", "javascript", "angular js", "c#", "flask"],
        "skills": ["React", "Django", "Node.js", "React.js", "JavaScript", "Angular", "Flask", "REST APIs", "Git", "SDK"],
        "courses": [
            ["Django Crash Course [Free]", "https://youtu.be/e1IyzVyrLSU"],
            ["Python and Django Full Stack Web Developer Bootcamp", "https://www.udemy.com/course/python-and-django-full-stack-web-developer-bootcamp"],
            ["React Crash Course [Free]", "https://youtu.be/Dorf8i6lCuk"],
            ["Node.js and Express.js [Free]", "https://youtu.be/Oe421EPjeBE"],
            ["Full Stack Web Developer by Udacity", "https://www.udacity.com/course/full-stack-web-developer-nanodegree--nd0044"],
        ],
    },
    "Android Development": {
        "keywords": ["android", "android development", "flutter", "kotlin", "xml", "kivy"],
        "skills": ["Android", "Android Development", "Flutter", "Kotlin", "XML", "Java", "Git", "SDK", "SQLite"],
        "courses": [
            ["Android Development for Beginners [Free]", "https://youtu.be/fis26HvvDII"],
            ["Android App Development Specialization", "https://www.coursera.org/specializations/android-app-development"],
            ["Associate Android Developer Certification", "https://grow.google/androiddev/"],
            ["Android Basics by Google", "https://www.udacity.com/course/android-basics-nanodegree-by-google--nd803"],
            ["Flutter App Development Course [Free]", "https://youtu.be/rZLR5olMR64"],
        ],
    },
    "IOS Development": {
        "keywords": ["ios", "ios development", "swift", "cocoa", "cocoa touch", "xcode"],
        "skills": ["iOS", "Swift", "Cocoa", "Cocoa Touch", "Xcode", "Objective-C", "SQLite", "UIKit", "Auto Layout"],
        "courses": [
            ["iOS App Development by LinkedIn", "https://www.linkedin.com/learning/subscription/topics/ios"],
            ["iOS & Swift - The Complete iOS App Development Bootcamp", "https://www.udemy.com/course/ios-13-app-development-bootcamp/"],
            ["Become an iOS Developer", "https://www.udacity.com/course/ios-developer-nanodegree--nd003"],
            ["iOS App Development with Swift Specialization", "https://www.coursera.org/specializations/app-development"],
            ["Learn Swift by Codecademy", "https://www.codecademy.com/learn/learn-swift"],
        ],
    },
    "UI-UX Development": {
        "keywords": ["ux", "adobe xd", "figma", "zeplin", "balsamiq", "ui", "prototyping", "wireframes", "user research", "user experience"],
        "skills": ["UI", "User Experience", "Figma", "Adobe XD", "Prototyping", "Wireframes", "User Research", "Design Thinking"],
        "courses": [
            ["Google UX Design Professional Certificate", "https://www.coursera.org/professional-certificates/google-ux-design"],
            ["UI / UX Design Specialization", "https://www.coursera.org/specializations/ui-ux-design"],
            ["The Complete App Design Course", "https://www.udemy.com/course/the-complete-app-design-course-ux-and-ui-design/"],
            ["Become a UX Designer by Udacity", "https://www.udacity.com/course/ux-designer-nanodegree--nd578"],
            ["Adobe XD Tutorial [Free]", "https://youtu.be/68w2VwalD5w"],
        ],
    },
}

RESUME_VIDEOS = ["https://youtu.be/y8YH0Qbu5h4", "https://youtu.be/J-4Fv8nq1iA", "https://youtu.be/yp693O87GmM"]
INTERVIEW_VIDEOS = ["https://youtu.be/Ji46s5BHdr0", "https://youtu.be/seVxXHi2YMs", "https://youtu.be/9FgfsLa_SmY"]

class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=50, max_length=120000)
    file_name: str = "resume"
    page_count: int | None = Field(default=None, ge=1, le=100)

@app.get("/health")
def health():
    return {"ok": True, "ai_configured": bool(os.getenv("GEMINI_API_KEY")), "model": MODEL}

def legacy_analysis(text: str, page_count: int | None) -> dict[str, Any]:
    lower = text.lower()
    detected = []
    for field, data in FIELD_DATA.items():
        matches = [keyword for keyword in data["keywords"] if keyword in lower]
        if matches:
            detected.append((field, len(matches), matches))
    selected = max(detected, key=lambda item: item[1]) if detected else ("Software Engineering", 0, [])
    career_field = selected[0]

    sections = {
        "Objective": bool(re.search(r"\bobjective\b|career objective|summary|profile", lower)),
        "Declaration": bool(re.search(r"\bdeclaration\b", lower)),
        "Hobbies / Interests": bool(re.search(r"\bhobbies?\b|\binterests?\b", lower)),
        "Achievements": bool(re.search(r"\bachievements?\b|awards?|honors?", lower)),
        "Projects": bool(re.search(r"\bprojects?\b|portfolio", lower)),
        "Experience": bool(re.search(r"experience|employment|internship", lower)),
        "Education": bool(re.search(r"education|university|college|degree|b\.tech|bachelor", lower)),
        "Skills": bool(re.search(r"skills|technologies|technical", lower)),
    }
    legacy_score = min(100, sum(20 for key in ["Objective", "Declaration", "Hobbies / Interests", "Achievements", "Projects"] if sections[key]))
    missing = [key for key, present in sections.items() if not present]
    candidate_level = "Fresher" if page_count == 1 else "Intermediate" if page_count == 2 else "Experienced" if page_count and page_count >= 3 else None
    data = FIELD_DATA.get(career_field, {})
    tips = []
    if not sections["Objective"]: tips.append("Consider a concise career objective or professional summary tailored to the target role.")
    if not sections["Projects"]: tips.append("Add projects with your contribution, technologies and measurable outcomes.")
    if not sections["Achievements"]: tips.append("Add achievements, awards or competition results where relevant.")
    if not sections["Experience"]: tips.append("Include internships, work, research, freelance or leadership experience when applicable.")
    if not re.search(r"\d+%|\d+ users|\d+ ms|\d+ projects|\d+ years|\d+\+", lower): tips.append("Quantify impact with metrics such as %, users, latency, scale or time saved.")
    email = re.search(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", text, re.I)
    phone = re.search(r"(?:\+?\d[\d\s().-]{8,}\d)", text)
    return {
        "legacy_score": legacy_score,
        "career_field": career_field,
        "candidate_level": candidate_level,
        "legacy_detected_keywords": selected[2],
        "recommended_skills": data.get("skills", []),
        "recommended_courses": [{"title": title, "url": url} for title, url in data.get("courses", [])],
        "resume_tips": tips[:5],
        "missing_sections": missing,
        "contact": {"email": email.group(0) if email else "", "phone": phone.group(0).strip() if phone else ""},
        "resume_videos": RESUME_VIDEOS,
        "interview_videos": INTERVIEW_VIDEOS,
    }

def fallback_result(legacy: dict[str, Any], file_name: str, reason: str) -> dict[str, Any]:
    return {
        **legacy,
        "mode": "legacy",
        "file_name": file_name,
        "score": legacy["legacy_score"],
        "summary": reason,
        "skills": legacy["legacy_detected_keywords"],
        "strengths": ["Legacy resume structure checks completed.", "Career direction was inferred from detected technical keywords."],
        "improvements": legacy["resume_tips"],
        "ats_keywords": legacy["legacy_detected_keywords"],
        "recommended_roles": [legacy["career_field"], "Software Engineer", "Full Stack Developer"],
        "questions": ["Walk through your strongest project.", "Which technology on your resume are you most confident using?", "Describe a difficult problem you solved."],
    }

@app.post("/api/analyze-resume")
def analyze_resume(request: AnalyzeRequest):
    legacy = legacy_analysis(request.text, request.page_count)
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        return fallback_result(legacy, request.file_name, "Kairos used the original Smart Resume Analyser rules. Add Gemini API access for deeper AI-generated feedback.")

    prompt = (
        "You are Kairos Resume AI. Analyze the resume and improve the supplied legacy Smart Resume Analyser results. "
        "The legacy system used PyResParser/PDFMiner, keyword career classification, five 20-point section checks, "
        "skill recommendations, course recommendations and interview preparation. Preserve useful findings when supported, "
        "but correct generic recommendations. Do not invent facts. Return ONLY valid JSON with keys: "
        "score, career_field, summary, skills, strengths, improvements, ats_keywords, missing_sections, recommended_roles, "
        "questions, recommended_skills, recommended_courses, resume_tips, candidate_level. "
        "recommended_courses must be an array of objects with title and url. score must be 0-100. "
        "Legacy baseline: " + json.dumps(legacy) + "\nResume text:\n" + request.text
    )
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json", "thinkingConfig": {"thinkingLevel": "low"}},
    }
    try:
        response = requests.post(URL.format(model=MODEL), headers={"Content-Type": "application/json", "x-goog-api-key": key}, json=payload, timeout=90)
        if not response.ok:
            return fallback_result(legacy, request.file_name, f"Gemini was unavailable (HTTP {response.status_code}), so Kairos used the legacy resume analyzer.")
        data = response.json()
        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        output = "".join(part.get("text", "") for part in parts).strip()
        if not output:
            raise ValueError("Gemini returned no text.")
        ai = json.loads(output)
        result = {**legacy, **ai, "mode": "hybrid", "file_name": request.file_name}
        for key_name in ["recommended_skills", "recommended_courses", "resume_tips", "missing_sections", "candidate_level"]:
            if not result.get(key_name):
                result[key_name] = legacy[key_name]
        result["legacy_score"] = legacy["legacy_score"]
        result["contact"] = legacy["contact"]
        result["resume_videos"] = legacy["resume_videos"]
        result["interview_videos"] = legacy["interview_videos"]
        return result
    except (requests.RequestException, json.JSONDecodeError, ValueError):
        return fallback_result(legacy, request.file_name, "Gemini returned an unusable response, so Kairos used the legacy resume analyzer.")
