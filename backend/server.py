import json
import os
import sys
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

# Support both normal and PyInstaller-bundled paths
if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys._MEIPASS)
else:
    BASE_DIR = Path(__file__).resolve().parent.parent

app = Flask(__name__, static_folder=None)

FRONTEND_DIR = BASE_DIR / "frontend"

# Persistent config file for API key (survives app restarts)
CONFIG_DIR = Path(os.environ.get("APPDATA", Path.home())) / "LinkedInRedactor"
CONFIG_FILE = CONFIG_DIR / "config.json"


def load_config():
    try:
        return json.loads(CONFIG_FILE.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_config(data):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(json.dumps(data))


@app.route("/config", methods=["GET"])
def get_config():
    return jsonify(load_config())


@app.route("/config", methods=["POST"])
def set_config():
    data = request.get_json() or {}
    config = load_config()
    config.update(data)
    save_config(config)
    return jsonify({"ok": True})


@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
