"""LinkedIn Redactor - Windows Desktop App

Starts the Flask backend in a background thread and opens the UI in a native window.
"""

import os
import sys
import threading
from pathlib import Path

# Support PyInstaller bundled paths
if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys._MEIPASS)
else:
    BASE_DIR = Path(__file__).resolve().parent

# Ensure backend module is importable
sys.path.insert(0, str(BASE_DIR))

from backend.server import app as flask_app
import webview


def start_server():
    flask_app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)


if __name__ == "__main__":
    # Persistent storage so localStorage (API key) survives app restarts
    storage_dir = Path(os.environ.get("APPDATA", Path.home())) / "LinkedInRedactor"
    storage_dir.mkdir(parents=True, exist_ok=True)

    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    webview.create_window(
        "LinkedIn Redactor",
        "http://127.0.0.1:5000",
        width=650,
        height=750,
        min_size=(400, 500),
    )
    webview.start(storage_path=str(storage_dir))
