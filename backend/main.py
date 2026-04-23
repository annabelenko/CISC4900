import json
import os
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.8)

prompt = ChatPromptTemplate.from_template(
    "Generate a short multiple choice question (max 15 words) about accessibility or inclusion in education. "
    "Keep each answer option under 8 words. "
    "Return ONLY valid JSON: "
    '{{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0}} '
    "where correct is the 0-based index of the right answer."
)

chain = prompt | llm

last_question_text = None

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


@app.get("/api/question")
async def get_question():
    global last_question_text

    try:
        data = None
        # Retry a few times to reduce duplicate consecutive questions.
        for _ in range(3):
            response = await chain.ainvoke({})
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
