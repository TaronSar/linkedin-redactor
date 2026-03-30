# LinkedIn Redactor

## Project Overview
A cross-platform app (Windows + Android) that transforms casual achievement descriptions into professional LinkedIn posts using Google's Gemini AI. Users get a free Gemini API key and the app calls the API directly from the client — no server costs, no middleman.

## Architecture

### Windows (.exe)
- `app.py` — Entry point. Starts Flask server in a background thread, opens `pywebview` native window pointing at `http://127.0.0.1:5000`.
- `backend/server.py` — Minimal Flask app that serves the frontend HTML/JS/CSS files and provides `/config` GET/POST endpoints for persisting the API key to `%APPDATA%/LinkedInRedactor/config.json`.
- `frontend/` — The actual app UI (HTML + CSS + JS). Calls Gemini API directly from JavaScript. No backend proxy.
- Built with PyInstaller into a single `.exe` (`linkedin_redactor.spec`).

### Android (.apk)
- `android/` — Minimal Kotlin WebView app that loads `file:///android_asset/index.html`.
- `android/app/src/main/assets/` — Copy of the frontend files (index.html, app.js, style.css). Must be kept in sync with `frontend/`.
- API key stored in `localStorage` (persists natively in Android WebView).
- Built with Gradle. Requires JDK 17 + Android SDK (use Docker or local install).

### Shared Frontend (both platforms)
- `frontend/index.html` — Onboarding screen + main app screen.
- `frontend/app.js` — All logic: Gemini API calls, tone selection, length slider, API key management, clipboard copy.
- `frontend/style.css` — LinkedIn-blue theme, responsive, minimalist.
- Calls `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` directly.

## Key Design Decisions
- No server-side API key. Each user gets their own free Gemini key.
- API key persisted via `/config` endpoint (file-backed) on Windows, `localStorage` on Android.
- System prompts support two tones: Professional and Satirical.
- Length slider (5 levels) appends length instructions to the system prompt.
- No emojis in generated output (per user preference).

## Build Commands

### Windows .exe
```bash
cd C:\Users\trnsr\OneDrive\Desktop\Apps\linkedin_redactor
pyinstaller linkedin_redactor.spec --distpath ./dist --workpath ./build --noconfirm
```
Requires: Python 3.10+, pyinstaller, pywebview, flask.

### Android .apk
```bash
# Copy frontend to Android assets first:
cp frontend/{index.html,app.js,style.css} android/app/src/main/assets/

# Build (requires JDK 17 + Android SDK):
cmd /c "set JAVA_HOME=C:\temp\jdk-17.0.12&& set ANDROID_HOME=C:\temp\android-sdk&& cd /d C:\temp\android-build&& gradlew.bat assembleDebug"
```
Output: `app/build/outputs/apk/debug/app-debug.apk`

## Important: Keep Android Assets in Sync
After modifying any file in `frontend/`, copy the changed files to `android/app/src/main/assets/` before building the APK.

## Workflow
- Always commit and push changes to GitHub repo `TaronSar/linkedin-redactor` after making changes.
- Rebuild both .exe and .apk after any frontend/backend changes.
- Dist files (.exe, .apk) are in `.gitignore` — not committed.
