# Kairos Deployment

## 1. Frontend

Build the Vite app:

    npm ci
    npm run build

For Firebase Hosting, the repository already contains a SPA rewrite to `dist/index.html`.

Set:

    VITE_AI_API_URL=https://YOUR-AI-SERVICE.example.com

Then deploy:

    firebase deploy --only hosting,firestore:rules

Firebase Hosting is intended for the static React/Vite frontend; the Python AI service should run separately, such as on a container service.

## 2. AI service

Local development:

    cd ai-server
    python -m venv .venv
    .venv\Scripts\activate
    pip install -r requirements.txt
    copy .env.example .env

Start it with:

    python -m uvicorn main:app --reload --port 8000

Production:

    docker build -t kairos-ai ./ai-server
    docker run -p 8000:8000 --env-file ai-server/.env kairos-ai

Set production environment values:

    APP_ENV=production
    REQUIRE_AUTH=true
    CORS_ORIGINS=https://YOUR-FRONTEND-DOMAIN

The backend verifies Firebase ID tokens when `REQUIRE_AUTH=true`. Firebase documents this pattern for custom backends.

Provide Firebase Admin credentials through the deployment secret manager. Do not commit a service-account JSON file.

## 3. Gemini

Configure:

    GEMINI_API_KEY=...
    GEMINI_MODEL=gemini-3.8-flash

The key stays on the Python server and is never bundled into the React application.

## 4. Local model

Kairos supports an Ollama-backed local provider:

    OLLAMA_BASE_URL=http://127.0.0.1:11434
    OLLAMA_MODEL=qwen3:4b

The local option is available only when the configured Ollama server is reachable by the AI service.

Important: if the AI service is deployed to a cloud host, `127.0.0.1` refers to that cloud host, not the candidate's laptop. To use a model running on your own laptop, run the AI service locally and point the frontend at that local service, or provide a securely reachable Ollama endpoint.

## 5. Production checklist

- Use HTTPS for the frontend and AI service.
- Set `REQUIRE_AUTH=true`.
- Set `CORS_ORIGINS` to the exact production frontend origin instead of `*`.
- Store Gemini and Firebase Admin credentials in deployment secrets.
- Deploy the Firestore rules from this repository.
- Keep the AI service behind authentication and reasonable platform rate limits.
- Test PDF/DOCX extraction, both AI providers, Google login, email login, job matching and application submission after deployment.
