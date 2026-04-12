import json
import os
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

llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.8)

prompt = ChatPromptTemplate.from_template(
    "Generate a multiple choice question about accessibility, inclusion, "
    "or overcoming barriers in education. "
    "Return ONLY valid JSON with this exact format: "
    '{{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0}} '
    "where correct is the 0-based index of the right answer."
)

chain = prompt | llm


@app.get("/api/question")
async def get_question():
    try:
        response = await chain.ainvoke({})
        data = json.loads(response.content)
        return data
    except Exception:
        return {
            "question": "What does accessibility mean in education?",
            "options": [
                "Only for disabled students",
                "Ensuring equal access for all learners",
                "Making things more expensive",
                "Reducing course difficulty",
            ],
            "correct": 1,
        }
