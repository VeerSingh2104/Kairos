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
