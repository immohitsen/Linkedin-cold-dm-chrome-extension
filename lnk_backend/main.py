import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

app = FastAPI()

# Enable CORS for Chrome Extensions by allowing all origins (credentials disabled)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.get("/")
def read_root():
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

    # The System Prompt: Defines Persona, Constraints, and Structure
    system_prompt = """You are an elite B2B copywriter specializing in highly personalized, conversational LinkedIn cold outreach.
    Your objective is to write human-sounding, low-friction Direct Messages that start conversations, not aggressive sales pitches.

    STRICT CONSTRAINTS:
    1. OUTPUT ONLY THE FINAL MESSAGE: No preamble, no postscript, no quotes around the text.
    2. NO PLACEHOLDERS: Do not use brackets like [Name] or [Company]. Use the provided context. If data is missing, adapt smoothly.
    3. NO FLUFF: Never use greetings like "I hope this finds you well," "Happy Friday," or "Hope you're having a good week." Start immediately.
    4. TONE: Professional, concise, and highly conversational. Avoid marketing buzzwords (e.g., 'synergy', 'innovative', 'streamline').

    DM STRUCTURE:
    - Pattern Interrupt (Hook): 1 brief sentence referencing their specific background (Headline/About).
    - The Bridge: Why you are reaching out right now, tying their background to your context.
    - Soft Ask (CTA): End with a single, low-friction, open-ended question. Never ask for a meeting or a call in the first message."""

    # Handle missing profile data gracefully
    headline_text = data.profileData.headline if data.profileData.headline else "No headline provided."
    about_text = data.profileData.about if data.profileData.about else "No about section provided."

    # The User Prompt: Cleanly structures the incoming variables
    user_prompt = f"""
        Draft a LinkedIn DM to {data.profileData.name} based on the following parameters:

        <recipient_profile>
        Headline: {headline_text}
        About: {about_text}
        </recipient_profile>

        <generation_parameters>
        Intent/Context: {data.context}
        Tone/Style: {data.style}
        Length constraints: {length_instruction}
        </generation_parameters>

        Write the message now following all system constraints.
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
