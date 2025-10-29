# utils.py

import os
import re
import json
import whisper
from dotenv import load_dotenv
import google.generativeai as genai  # Updated import
from pydantic import BaseModel
import sys

load_dotenv()

# --- Rest of your Pydantic models remain the same ---
class Flashcard(BaseModel):
    question: str
    answer: str

class LectureSummary(BaseModel):
    title: str
    summary: str
    bulleted_notes: list[str]
    key_takeaways: list[str]
    flashcards: list[Flashcard]

def transcribe_file(file_path: str) -> str:
    """Initializes and uses Whisper for transcription."""
    print(f"Transcribing: {file_path}")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File does not exist: {file_path}")
    
    try:
        MODEL_NAME = os.getenv("MODEL_NAME", "small")
        model = whisper.load_model(MODEL_NAME)
    except Exception as e:
        raise RuntimeError(f"Whisper model loading failed: {e}")

    try:
        result = model.transcribe(file_path)
        return result.get("text", "")
    except Exception as e:
        raise RuntimeError(f"Error during transcription: {e}")

def generate_notes_from_transcript(transcript: str) -> dict:
    """
    Summarizes a transcript into structured notes using Gemini.
    """
    if not transcript.strip():
        return {"error": "Transcript is empty."}

    try:
        # Initialize the Gemini client
        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=GEMINI_API_KEY)  # Configure the API key
        GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")  # Using a more recent model
        
        model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        
        prompt = f"""
        You are an expert lecture summarizer.
        Analyze the lecture transcript below and generate a structured summary.
        Return the response in JSON format with the following structure:
        {{
            "title": "string",
            "summary": "string",
            "bulleted_notes": ["string"],
            "key_takeaways": ["string"],
            "flashcards": [{{"question": "string", "answer": "string"}}]
        }}
        Transcript: {transcript[:4000]}
        """

        response = model.generate_content(prompt)
        
        # Extract the text from the response
        response_text = response.text
        
        # Clean the response text (remove markdown code blocks if present)
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()
            
        # Parse the JSON response
        return json.loads(response_text)

    except Exception as e:
        return {"error": f"Gemini summarization failed: {str(e)}"}