from app.tasks.celery import app

from llama_index.core import Settings
from llama_index.llms.ollama import Ollama

Settings.llm = Ollama(model="gemma3:4b", request_timeout=120.0, base_url="http://localhost:11434")

@app.task
def generate(prompt: str):
    result = Settings.llm.complete(prompt)
    return result.text

