import os
import io
import base64
import requests
import pdfplumber
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

app = FastAPI()

# CORS setup is CRITICAL for Chrome Extensions to communicate with the server
# Replace the placeholder below with your actual Chrome Extension ID after loading it in Chrome.
# To find your Extension ID: go to chrome://extensions -> enable Developer Mode -> copy the ID shown.
EXTENSION_ID = os.getenv("EXTENSION_ID", "YOUR_EXTENSION_ID_HERE")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[f"chrome-extension://{EXTENSION_ID}"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.1-8b-instant"

# Pydantic models to validate the incoming data from the extension
class ProfileData(BaseModel):
    name: str
    headline: str
    about: str

class DMRequest(BaseModel):
    length: str
    style: str
    context: str
    profileData: ProfileData
    resumeBase64: Optional[str] = None

@app.get("/")
def read_root():
    # This endpoint is useful for the Cronjob to ping and keep the server awake!
    return {"status": "Server is awake and running!"}

@app.post("/generate")
def generate_dm(data: DMRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="API Key not configured on server")

    length_instruction = ""
    if data.length == "short":
        length_instruction = "Keep it under 50 words."
    elif data.length == "medium":
        length_instruction = "Keep it between 50 and 100 words."
    elif data.length == "long":
        length_instruction = "Write more than 100 words."

    # Parse resume PDF if provided
    resume_context = ""
    if data.resumeBase64:
        try:
            pdf_bytes = base64.b64decode(data.resumeBase64)
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                resume_text = "\n".join(
                    page.extract_text() or "" for page in pdf.pages
                ).strip()
            # Cap at 3000 chars to stay within token budget
            resume_context = resume_text[:3000]
        except Exception:
            resume_context = ""  # Silently skip if parsing fails

    system_prompt = "You are an expert sales and networking assistant. Your goal is to write highly effective, personalized cold LinkedIn Direct Messages. Do not include any placeholder text like [Your Name]. Output ONLY the final message content, ready to be sent. Never complain about missing information."

    if resume_context:
        system_prompt += f"\n\nThe sender's background (from their resume):\n{resume_context}"

    headline_text = f"Their headline is: {data.profileData.headline}." if data.profileData.headline else ""
    about_text = f"Their about section is: {data.profileData.about}." if data.profileData.about else ""

    user_prompt = f"""
      Write a LinkedIn DM to {data.profileData.name}.
      {headline_text}
      {about_text}

      Style/Tone: {data.style}
      Length: {length_instruction}
      Context/Why I am reaching out: {data.context}

      Just write the message now based on whatever context is provided.
    """

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7
    }

    # Send request to Groq securely from the backend
    response = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
    
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    result = response.json()
    generated_text = result["choices"][0]["message"]["content"].strip()
    
    return {"text": generated_text}
