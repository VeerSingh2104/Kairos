import os
from fastapi import FastAPI

app = FastAPI()
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json
import requests

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=50, max_length=120000)
    file_name: str = "resume"

@app.get("/health")
def health():
    return {"ok": True, "ai_configured": bool(os.getenv("GEMINI_API_KEY")), "model": MODEL}

@app.post("/api/analyze-resume")
def analyze_resume(request: AnalyzeRequest):
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        return {"mode": "unconfigured", "file_name": request.file_name}

    prompt = (
        "You are Kairos Resume AI. Analyze the resume below. "
        "Return ONLY valid JSON with keys: score, career_field, summary, skills, strengths, improvements, "
        "ats_keywords, missing_sections, recommended_roles, questions. "
        "Score from 0 to 100. Do not invent facts. Keep arrays concise. "
        "Resume text: " + request.text
    )
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
    }
    response = requests.post(
        URL.format(model=MODEL),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
        json=payload,
        timeout=60
    )
    response.raise_for_status()
    data = response.json()
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    output = "".join(part.get("text", "") for part in parts).strip()
    result = json.loads(output)
    result["mode"] = "gemini"
    result["file_name"] = request.file_name
    return result
