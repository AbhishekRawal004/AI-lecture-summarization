#main.py
import os
import json
import uuid
import aiofiles
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from utils import transcribe_file, generate_notes_from_transcript

load_dotenv()

# Ensure FFmpeg is in PATH (redundant but safe)
ffmpeg_path = r"C:\ffmpeg\bin"
if ffmpeg_path not in os.environ["PATH"]:
    os.environ["PATH"] = ffmpeg_path + os.pathsep + os.environ["PATH"]

app = FastAPI(title="AI Lecture Summarizer API 🚀")

# Allow Angular frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict later to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
TRANSCRIPT_DIR = BASE_DIR / "transcripts"
SUMMARY_DIR = BASE_DIR / "summaries"

for folder in [UPLOAD_DIR, TRANSCRIPT_DIR, SUMMARY_DIR]:
    folder.mkdir(exist_ok=True, parents=True)

# Simple in-memory job store
JOBS = {}

class JobResponse(BaseModel):
    job_id: str
    status: str
    summary: dict | None = None

@app.post("/upload", response_model=JobResponse)
async def upload_file(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """
    Upload a lecture audio/video file and start background transcription + summarization.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    job_id = str(uuid.uuid4())
    file_ext = Path(file.filename).suffix
    file_path = UPLOAD_DIR / f"{job_id}{file_ext}"

    # Save file asynchronously
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    # Initialize job
    JOBS[job_id] = {"status": "processing", "file_path": str(file_path), "summary": None}

    # Run background task
    background_tasks.add_task(process_job, job_id)

    return JobResponse(job_id=job_id, status="processing")

@app.get("/status/{job_id}", response_model=JobResponse)
def get_status(job_id: str):
    """
    Check processing status or retrieve final summary.
    """
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobResponse(job_id=job_id, status=job["status"], summary=job.get("summary"))

def process_job(job_id: str):
    """
    Background job: Transcribe file → Generate notes → Save outputs.
    Catches all errors and stores them in the job status.
    """
    job = JOBS[job_id]
    file_path = job["file_path"]

    try:
        # Step 1: Transcribe
        absolute_path = os.path.abspath(file_path)
        transcript = transcribe_file(absolute_path)

        # Save transcript
        transcript_path = TRANSCRIPT_DIR / f"{job_id}.txt"
        with open(transcript_path, "w", encoding="utf-8") as f:
            f.write(transcript)

        # Step 2: Summarize
        summary = generate_notes_from_transcript(transcript)

        # Save summary JSON
        summary_path = SUMMARY_DIR / f"{job_id}.json"
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)

        # Update job info
        job["summary"] = summary
        job["status"] = "completed"

    except Exception as e:
        # Capture full error message in job status
        job["status"] = f"error: {str(e)}"
        job["summary"] = None

@app.get("/")
def root():
    return {"message": "✅ AI Lecture Summarizer API is running!"}