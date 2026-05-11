import asyncio
import json
import os
import random
import httpx
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_chroma import Chroma

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

llm_main = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0.8)
llm_classroom = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0.8)

prompt = ChatPromptTemplate.from_template(
    "You are creating quiz questions for an educational game that teaches players about disability and inclusion. "
    "Assume the player has zero prior knowledge — the question itself should teach them something real.\n\n"
    "Use only the facts and situations in these excerpts as your source material:\n"
    "-----\n"
    "{context}\n"
    "-----\n"
    "Write a question about a SPECIFIC disability or condition and a SPECIFIC challenge or experience it causes in daily life.\n"
    "The challenge can involve anything real: reading, movement, social interaction, work, learning, navigation, or everyday tasks.\n\n"
    "Strict rules:\n"
    "- Name a specific disability or condition (not just 'a person with a disability')\n"
    "- NEVER mention 'the study', 'research', 'experiment', 'researchers', 'participants', 'findings', or academic acronyms\n"
    "- NEVER ask about requirements, eligibility, or how to join a study or program\n"
    "- NEVER use 'our' or 'we' — always refer to people by their specific condition\n"
    "- Plain, friendly language anyone can understand with no background\n"
    "- Question: max 20 words. Each answer option: max 10 words\n"
    "- Exactly 4 options; wrong answers should be plausible but clearly not the best answer\n"
    "Return ONLY valid JSON with no extra text: "
    '{{\"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correct\": 0}} '
    "where correct is the 0-based index of the right answer."
)

chain_main = prompt | llm_main
chain_classroom = prompt | llm_classroom

# ─── RAG: load vector DB (built once by ingest.py) ────────────────────────────
_CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
_embeddings = HuggingFaceEmbeddings(model_name="Snowflake/snowflake-arctic-embed-m")

if os.path.exists(_CHROMA_DIR):
    _vectordb = Chroma(persist_directory=_CHROMA_DIR, embedding_function=_embeddings)
    print(f"[RAG] Loaded ChromaDB with {_vectordb._collection.count()} chunks")
else:
    _vectordb = None
    print("[RAG] chroma_db not found — run ingest.py first. Falling back to generic prompt.")


_RAG_QUERIES = [
    "findings results study participants disability",
    "accommodation support strategies students barriers",
    "visual impairment peripheral vision campus navigation",
    "faculty professor instructor awareness response",
    "disclosure documentation letter accommodation request",
    "emotional psychological anxiety stress experience",
    "policy law legislation disability rights",
    "technology assistive tools screen reader",
]


def _get_context(k: int = 5) -> str:
    """Retrieve chunks using a random topic query for variety each call."""
    if _vectordb is None:
        return "(no research context available)"
    query = random.choice(_RAG_QUERIES)
    docs = _vectordb.similarity_search(query, k=k)
    return "\n\n".join(d.page_content for d in docs)

# ─── Server-side question pool ────────────────────────────────────────────────
_POOL_SIZE = 2  # keep two questions pre-generated so scene transitions don't stall
_Q_QUESTIONS: asyncio.Queue = asyncio.Queue()
last_question_text = None

async def _generate_one(chain) -> dict:
    context = _get_context()
    response = await chain.ainvoke({"context": context})
    return _extract_json(response.content)

async def _refill():
    """Top up the shared pool to _POOL_SIZE in the background."""
    while _Q_QUESTIONS.qsize() < _POOL_SIZE:
        try:
            data = await _generate_one(chain_main)
            await _Q_QUESTIONS.put(data)
            print(f"[pool] pool now {_Q_QUESTIONS.qsize()}/{_POOL_SIZE}")
        except Exception as e:
            print(f"[pool] refill error: {e}")
            break

@app.on_event("startup")
async def prefill_queues():
    asyncio.create_task(_refill())

fallback_questions = [
    {
        "question": "What is an accommodation in school?",
        "options": [
            "A punishment",
            "Support for equal learning",
            "A class grade",
            "A school holiday",
        ],
        "correct": 1,
    },
    {
        "question": "Why are captions important in class videos?",
        "options": [
            "Decorative style",
            "Only for teachers",
            "Improve access for more students",
            "Increase homework",
        ],
        "correct": 2,
    },
    {
        "question": "Which practice supports inclusive teaching?",
        "options": [
            "One test format only",
            "Multiple ways to participate",
            "Ignore student needs",
            "Remove class notes",
        ],
        "correct": 1,
    },
    {
        "question": "What does accessible course design mean?",
        "options": [
            "Harder content only",
            "Materials usable by diverse learners",
            "No deadlines ever",
            "No feedback given",
        ],
        "correct": 1,
    },
    {
        "question": "Why provide alt text for images?",
        "options": [
            "To hide images",
            "To help screen reader users",
            "To reduce grades",
            "To remove context",
        ],
        "correct": 1,
    },
]


def _extract_json(content: str):
    text = content.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0]

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


def _pick_fallback(last_question):
    if len(fallback_questions) == 1:
        return fallback_questions[0]

    candidates = [q for q in fallback_questions if q["question"] != last_question]
    if not candidates:
        candidates = fallback_questions
    return random.choice(candidates)


ELEVENLABS_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"  # Rachel — change to any voice ID you prefer

@app.post("/api/tts")
async def text_to_speech(payload: dict):
    text = payload.get("text", "")
    api_key = os.getenv("ELEVENLABS_API_KEY", "")
    if not api_key:
        return {"error": "ELEVENLABS_API_KEY not set"}

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {"xi-api-key": api_key, "Content-Type": "application/json"}
    body = {
        "text": text,
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, headers=headers, json=body)
        if not resp.is_success:
            print(f"ElevenLabs error {resp.status_code}: {resp.text}")
            resp.raise_for_status()
        audio_bytes = resp.content

    return StreamingResponse(
        iter([audio_bytes]),
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline", "Cache-Control": "no-cache"}
    )


@app.get("/api/question")
async def get_question(scene: str = "main"):
    global last_question_text
    chain = chain_classroom if scene == "classroom" else chain_main

    try:
        data = None
        context = _get_context()
        for _ in range(3):
            response = await chain.ainvoke({"context": context})
            parsed = _extract_json(response.content)
            q_text = parsed.get("question", "") if isinstance(parsed, dict) else ""
            if q_text and q_text != last_question_text:
                data = parsed
                break

        if data is None:
            data = _pick_fallback(last_question_text)

        last_question_text = data.get("question")
        return data
    except Exception as e:
        print(f"LLM Error: {e}")
        fallback = _pick_fallback(last_question_text)
        last_question_text = fallback.get("question")
        return fallback

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
