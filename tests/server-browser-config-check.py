import os
import sys
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import browser_config_script


with patch.dict(os.environ, {}, clear=True):
    empty = browser_config_script().decode("utf-8")
    assert "window.WOOGI_FIREBASE_CONFIG = window.WOOGI_FIREBASE_CONFIG || null;" in empty
    assert 'window.WOOGI_FIREBASE_REGION = window.WOOGI_FIREBASE_REGION || "asia-northeast3";' in empty
    assert 'window.WOOGI_API_BASE_URL = window.WOOGI_API_BASE_URL || "";' in empty
    assert "window.WOOGI_ADMIN_UIDS = window.WOOGI_ADMIN_UIDS || [];" in empty

configured_env = {
    "WOOGI_FIREBASE_API_KEY": "demo-api-key",
    "WOOGI_FIREBASE_AUTH_DOMAIN": "demo.firebaseapp.com",
    "WOOGI_FIREBASE_PROJECT_ID": "demo-project",
    "WOOGI_FIREBASE_STORAGE_BUCKET": "demo.appspot.com",
    "WOOGI_FIREBASE_MESSAGING_SENDER_ID": "123456789",
    "WOOGI_FIREBASE_APP_ID": "1:123456789:web:abc",
    "WOOGI_FIREBASE_MEASUREMENT_ID": "G-DEMO",
    "WOOGI_FIREBASE_REGION": "asia-northeast3",
    "WOOGI_API_BASE_URL": "https://api.example.run.app",
    "WOOGI_ADMIN_UIDS": "uid-a, uid-b",
    "OPENAI_API_KEY": "must-not-leak",
    "DART_API_KEY": "must-not-leak",
    "KIS_APP_SECRET": "must-not-leak",
}
with patch.dict(os.environ, configured_env, clear=True):
    configured = browser_config_script().decode("utf-8")
    for expected in [
        '"apiKey": "demo-api-key"',
        '"authDomain": "demo.firebaseapp.com"',
        '"projectId": "demo-project"',
        '"storageBucket": "demo.appspot.com"',
        '"messagingSenderId": "123456789"',
        '"appId": "1:123456789:web:abc"',
        '"measurementId": "G-DEMO"',
        '"https://api.example.run.app"',
        '["uid-a", "uid-b"]',
    ]:
        assert expected in configured
    for secret in ["must-not-leak", "OPENAI_API_KEY", "DART_API_KEY", "KIS_APP_SECRET"]:
        assert secret not in configured

print("server browser config checks passed")
