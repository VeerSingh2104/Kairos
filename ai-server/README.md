Run from ai-server:

python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt

Copy .env.example to .env and set GEMINI_API_KEY.
Start with: uvicorn main:app --reload --port 8000

The React app can call /api/analyze-resume through the Vite proxy.
