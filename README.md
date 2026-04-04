# LinkedUp

Turn your achievements into LinkedIn gold. LinkedUp transforms casual descriptions into polished LinkedIn posts using Google's Gemini AI.

Available as a **Windows desktop app** (.exe) and an **Android app** (.apk).

## How It Works

1. Get a free [Google Gemini API key](https://aistudio.google.com/app/apikey)
2. Enter your key once (stored locally, never sent to any server)
3. Describe your achievement in plain language
4. Get a polished LinkedIn post ready to publish

All API calls go directly from the app to Google — no backend server, no middleman, no cost.

## Features

- **Two tones** — Professional or Satirical (for those who enjoy LinkedIn parody)
- **Post length slider** — from "Very Short" (2-3 sentences) to "Very Long" (4-5 paragraphs)
- **Write & Improve modes** — generate from scratch or polish an existing draft
- **Templates** — quick-start prompts for common posts (New Job, Promotion, Project Launch, Conference, Certification, Team Win, Milestone)
- **3 variants per generation** — swipe through alternatives and pick your favorite
- **Post history** — saved locally, up to 50 entries
- **Dark mode** — toggleable, respects system preference
- **One-tap copy** to clipboard
- **No emojis** in generated output

## Screenshots

<!-- Add screenshots here -->

## Getting Started

### Prerequisites

- A free [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Windows

Download the latest `.exe` from [Releases](https://github.com/TaronSar/linkedin-redactor/releases) and run it. No installation needed.

### Android

Download the latest `.apk` from [Releases](https://github.com/TaronSar/linkedin-redactor/releases) and sideload it.

## Building from Source

### Windows (.exe)

Requires Python 3.10+, pyinstaller, pywebview, flask.

```bash
pip install pyinstaller pywebview flask
pyinstaller linkedin_redactor.spec --distpath ./dist --workpath ./build --noconfirm
```

Output: `dist/LinkedUp.exe`

### Android (.apk)

Requires JDK 17 + Android SDK.

```bash
# Copy frontend to Android assets first
cp frontend/index.html frontend/app.js frontend/style.css android/app/src/main/assets/

# Build with Gradle
cd android
./gradlew assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk`

## Architecture

```
frontend/          Shared UI (HTML + CSS + JS) — used by both platforms
  index.html       Onboarding + main app screen
  app.js           All logic: Gemini API calls, tones, templates, history
  style.css        LinkedIn-blue theme, responsive

app.py             Windows entry point (Flask + pywebview)
backend/server.py  Minimal Flask server for serving frontend & persisting config

android/           Kotlin WebView app wrapping the same frontend
```

The frontend calls the Gemini API directly from JavaScript. On Windows, the API key is saved to `%APPDATA%/LinkedInRedactor/config.json`. On Android, it's stored in `localStorage`.

## Privacy

- Your API key stays on your device
- No analytics, no tracking, no telemetry
- All AI requests go directly from your device to Google's API
- No data is sent to any third-party server

## License

MIT
