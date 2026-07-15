import os
import json
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.middleware import LOG_DIR
import uuid
import time

client = TestClient(app)

def test_audit_log_creation():
    # Clean up logs directory before test
    for f in os.listdir(LOG_DIR):
        os.remove(os.path.join(LOG_DIR, f))

    prompt_text = "This is a test prompt with 8 words"
    payload = {
        "prompt": prompt_text,
        "scenario": "pedagogical"
    }

    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 200

    # Wait briefly for file write just in case (though it's sync in finally block)
    time.sleep(0.1)

    logs = os.listdir(LOG_DIR)
    assert len(logs) == 1, "Exactly one audit log should be created"

    log_file = logs[0]
    assert log_file.startswith("audit_")
    assert log_file.endswith(".json")

    with open(os.path.join(LOG_DIR, log_file), "r") as f:
        data = json.load(f)

    # Verify strict JSON schema for EU Regulation 2024/1689 Compliance
    assert "session_id" in data
    # Test valid UUID
    uuid_obj = uuid.UUID(data["session_id"], version=4)
    assert str(uuid_obj) == data["session_id"]

    assert "timestamp" in data # Should be ISO 8601

    assert "request_tokens" in data
    assert type(data["request_tokens"]) == int
    assert data["request_tokens"] == 8 # 8 words in our prompt

    assert "latency_ms" in data
    assert type(data["latency_ms"]) == float

    assert "model_version" in data
    assert type(data["model_version"]) == str

    assert "error_flag" in data
    assert type(data["error_flag"]) in [bool, int, str] # Can be boolean or system error code
    assert data["error_flag"] == False

def test_audit_log_error_flag():
    # Trigger an error (e.g. invalid method)
    # The middleware only intercepts POST /api/v1/chat, let's see if 405 error is tracked.
    # Actually wait, middleware intercepts only POST. We need to trigger an error ON a POST.
    # We can send bad JSON which will trigger 422 from FastAPI.
    response = client.post("/api/v1/chat", content="bad payload")
    assert response.status_code == 422

    # Find newest log file
    logs = os.listdir(LOG_DIR)
    # Get last modified
    newest_log = max([os.path.join(LOG_DIR, f) for f in logs], key=os.path.getmtime)

    with open(newest_log, "r") as f:
        data = json.load(f)

    assert data["error_flag"] == 422
