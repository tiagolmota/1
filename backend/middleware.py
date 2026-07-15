import os
import json
import uuid
from datetime import datetime, timezone
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse
import time

LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

class AuditEngineMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path != "/api/v1/chat" or request.method != "POST":
            return await call_next(request)

        session_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()
        start_time = time.time()
        error_flag = False

        request_tokens = 0
        model_version = "mock-model-v1" # Would be dynamic in prod

        # We need to read the body without consuming it permanently from the request
        body = await request.body()
        try:
            body_json = json.loads(body.decode("utf-8"))
            prompt = body_json.get("prompt", "")
            # Simple token estimation for the mock.
            # In a real implementation using llama-cpp-python, we'd tokenize this correctly.
            request_tokens = len(prompt.split())
        except Exception:
            pass # Invalid JSON or no prompt

        # Reconstruct the request to pass it down the chain
        async def receive():
            return {"type": "http.request", "body": body}
        request._receive = receive

        try:
            response = await call_next(request)
            # If the response isn't a 200, we might flag it
            if response.status_code >= 400:
                error_flag = response.status_code
        except Exception as e:
            error_flag = str(type(e).__name__)
            raise
        finally:
            latency_ms = (time.time() - start_time) * 1000

            audit_log = {
                "session_id": session_id,
                "timestamp": timestamp,
                "request_tokens": request_tokens,
                "latency_ms": latency_ms,
                "model_version": model_version,
                "error_flag": error_flag
            }

            log_file_path = os.path.join(LOG_DIR, f"audit_{session_id}.json")
            with open(log_file_path, "w", encoding="utf-8") as f:
                json.dump(audit_log, f, indent=2)

        return response
