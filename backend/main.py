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

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.8)

prompt = ChatPromptTemplate.from_template(
    "Generate a short multiple choice question (max 15 words) about accessibility or inclusion in education. "
    "Keep each answer option under 8 words. "
    "Return ONLY valid JSON: "
    '{{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0}} '
    "where correct is the 0-based index of the right answer."
)

chain = prompt | llm


@app.get("/api/question")
async def get_question():
    try:
        response = await chain.ainvoke({})
        content = response.content.strip()
        # Strip markdown code fences if present
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            content = content.rsplit("```", 1)[0]
        data = json.loads(content)
        return data
    except Exception as e:
        print(f"LLM Error: {e}")
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
