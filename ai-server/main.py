import os
from fastapi import FastAPI

app = FastAPI()
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
