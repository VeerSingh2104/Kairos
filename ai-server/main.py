import json
import os

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="Kairos AI Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
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
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured.")

    prompt = (
        "You are Kairos Resume AI. Analyze the resume below. "
        "Return ONLY valid JSON with keys: score, career_field, summary, skills, strengths, improvements, "
        "ats_keywords, missing_sections, recommended_roles, questions. "
        "Score from 0 to 100. Do not invent facts. Keep arrays concise. "
        "Resume text: " + request.text
    )

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "thinkingConfig": {"thinkingLevel": "low"}
        }
    }

    try:
        response = requests.post(
            URL.format(model=MODEL),
            headers={"Content-Type": "application/json", "x-goog-api-key": key},
            json=payload,
            timeout=90
        )
        if not response.ok:
            detail = response.text[:2000]
            raise HTTPException(status_code=502, detail=f"Gemini API returned HTTP {response.status_code}: {detail}")

        data = response.json()
        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        output = "".join(part.get("text", "") for part in parts).strip()

        if not output:
            raise ValueError(f"Gemini returned no text. Raw response: {json.dumps(data)[:2000]}")

        result = json.loads(output)
    except HTTPException:
        raise
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Could not reach Gemini API: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"Gemini returned invalid JSON: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Unexpected Gemini server error: {exc}") from exc

    result["mode"] = "gemini"
    result["file_name"] = request.file_name
    return result
