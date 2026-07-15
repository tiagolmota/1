from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import time
import os
from backend.middleware import AuditEngineMiddleware

app = FastAPI(title="Soberano IAGen", version="1.0.0")

app.add_middleware(AuditEngineMiddleware)

class ChatRequest(BaseModel):
    prompt: str
    scenario: str = "default"

class ChatResponse(BaseModel):
    response: str

try:
    from llama_cpp import Llama
    llm = Llama(
        model_path=os.environ.get("LLAMA_MODEL_PATH", "/models/model-q4_k_m.gguf"),
        n_ctx=2048,
        n_threads=int(os.environ.get("OMP_NUM_THREADS", 4))
    )
    # The requirement specifically mentions CPU support and 4-bit quantized (GGUF).
except Exception as e:
    # Fallback/mock if the model isn't mounted during development without docker
    print(f"Failed to load LLM: {e}")
    llm = None

@app.post("/api/v1/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    system_prompt = "You are a pedagogical assistant. Your goal is to guide the student towards the answer without giving it away directly."
    if request.scenario == "math":
        system_prompt = "You are a math tutor. Help the student solve the problem step-by-step."

    full_prompt = f"System: {system_prompt}\nUser: {request.prompt}\nAssistant:"

    if llm is not None:
        try:
            output = llm(
                full_prompt,
                max_tokens=256,
                stop=["User:", "\n"],
                echo=False
            )
            response_text = output['choices'][0]['text'].strip()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        # Fallback for dev mode where model file is not present
        response_text = f"[MOCK] Scenario '{request.scenario}'. Prompt received: '{request.prompt}'. (LLM not loaded)"

    return ChatResponse(response=response_text)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
