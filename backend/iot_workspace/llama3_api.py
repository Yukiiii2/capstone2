from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.iot_workspace.feedback_analyzer import FeedbackAnalyzer
from supabase import create_client, Client
from fastapi import Request

import whisper
import spacy
import uuid
import os
import tempfile
import wave
import difflib
from textblob import TextBlob  # Import TextBlob for sentiment analysis
import textstat  # Import textstat for readability analysis
import subprocess



def calculate_readability(transcription, sentences):
    avg_sentence_length = sum(len(sent) for sent in sentences) / len(sentences) if sentences else None
    return {
        "flesch_reading_ease": textstat.flesch_reading_ease(transcription),
        "gunning_fog": textstat.gunning_fog(transcription),
        "avg_sentence_length": avg_sentence_length,
    }

def analyze_delivery(transcription, doc, transcription_result):
    return {
        "filler_words": [word for word in transcription.split() if word.lower() in ["um", "uh", "like"]],
        "repeated_words": [token.text for token in doc if doc.count_by(spacy.attrs.LOWER)[token.lower] > 1],
        "words_per_minute": len(doc) / (transcription_result["duration"] / 60),
    }

def compare_transcriptions(transcription: str, expected_text: str):
    """
    Compare the transcription with the expected text and identify discrepancies.

    Args:
        transcription (str): The transcribed text from the audio.
        expected_text (str): The expected text to compare against.

    Returns:
        list: A list of discrepancies, where each discrepancy is marked as:
              - "- " for missing words in the transcription.
              - "+ " for extra/misheard words in the transcription.
    """
    transcription_words = transcription.split()
    expected_words = expected_text.split()

    # Use difflib to compare words
    diff = difflib.ndiff(expected_words, transcription_words)
    discrepancies = [word for word in diff if word.startswith("- ") or word.startswith("+ ")]

    return discrepancies

# =========================
# Supabase Configuration
# =========================
SUPABASE_URL = "https://ztlkzuslrokawaplrmnd.supabase.co"  # Replace with your Supabase URL
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bGt6dXNscm9rYXdhcGxybW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDgxNDcsImV4cCI6MjA2OTk4NDE0N30.232TtQIl00U-XdqMv3sJi8AUy3tjwMx5sgsWMlpHVoU"
)  # Replace with your Supabase anon key

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# =========================
# Environment Configuration
# =========================
# Ensure ffmpeg is available for Whisper
os.environ["PATH"] += os.pathsep + r"C:\ffmpeg\bin"

# =========================
# Initialize Models
# =========================
analyzer = FeedbackAnalyzer()
nlp = spacy.load("en_core_web_sm")
whisper_model = whisper.load_model("medium")

# =========================
# FastAPI App Configuration
# =========================
app = FastAPI(title="Speech Feedback API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Allow all origins (for development only)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Global Storage (Temporary)
# =========================
global_feedback = {}

# =========================
# Request Models
# =========================
class SpeechFeedbackRequest(BaseModel):
    student_id: str | None = None
    attempt_id: str | None = None
    speech_text: str
    spacy_stats: dict


# =========================
# API Endpoints
# =========================
@app.get("/user-info")
async def get_current_user(request: Request):
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = auth_header.split(" ")[1]  # "Bearer <token>"
    user = supabase.auth.get_user(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return {"user": user}
    
@app.post("/analyze-feedback")
async def analyze_feedback(request: SpeechFeedbackRequest, req: Request):
    """
    Analyze speech feedback, validate student ID,
    generate evaluation using Ollama AI, and store it in Supabase.
    """
    try:
        print(f"Request Headers: {req.headers}")  # Log all headers for debugging

        # --- Fetch Authorization Token ---
        auth_header = req.headers.get("Authorization")
        if not auth_header:
            print("Authorization header is missing.")
            raise HTTPException(
                status_code=401,
                detail="Unauthorized: Missing Authorization header."
            )

        if not auth_header.startswith("Bearer "):
            print("Authorization header is invalid.")
            raise HTTPException(
                status_code=401,
                detail="Unauthorized: Invalid Authorization header format."
            )

        token = auth_header.split("Bearer ")[1]
        print(f"Authorization Token: {token}")

        # --- Fetch Current User Info ---
        user_response = supabase.auth.get_user(token)  # Fetch user info from Supabase
        if not user_response or not user_response.get("user"):
            raise HTTPException(
                status_code=401,
                detail="Unauthorized: Unable to fetch user information from Supabase token."
            )

        user = user_response["user"]
        student_id = user["id"]  # Extract the student ID from the user object
        print(f"Student ID: {student_id}")

        # --- Process Feedback ---
        # Use the student_id for further processing
        print("Processing feedback...")
        print(f"Speech Text: {request.speech_text}")
        print(f"spaCy Stats: {request.spacy_stats}")

        # Example response
        return {
            "student_id": student_id,
            "speech_text": request.speech_text,
            "spacy_stats": request.spacy_stats,
            "message": "Feedback analyzed successfully."
        }

    except HTTPException as e:
        print(f"ERROR: /analyze-feedback - {e.detail}")
        raise e
    except Exception as e:
        print(f"ERROR: /analyze-feedback - {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the feedback")

@app.post("/process-audio")
async def process_audio(file: UploadFile = File(...), expected_text: str = None):
    """
    Process uploaded audio file → Convert to WAV → Transcribe speech using Whisper → Compare with expected text → Extract enhanced statistics for /analyze-feedback.
    """
    print("START: /process-audio endpoint")  # Log start of endpoint

    temp_audio_path = None
    temp_wav_path = None
    try:
        # --- Validate File Type ---
        print(f"Uploaded file: {file.filename}")
        if not file.filename.endswith((".wav", ".mp3", ".m4a", ".aac", ".ogg")):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload a valid audio file.")

        # --- Save Uploaded File ---
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            temp_audio_path = tmp.name
            tmp.write(await file.read())

        print(f"Temporary audio file path: {temp_audio_path}")

        # --- Convert to WAV Format ---
        temp_wav_path = tempfile.mktemp(suffix=".wav")
        try:
            command = [
                "ffmpeg",
                "-i", temp_audio_path,  # Input file
                "-acodec", "pcm_s16le",  # Audio codec: PCM signed 16-bit little-endian
                "-ar", "44100",  # Audio sample rate: 44.1 kHz
                "-ac", "2",  # Number of audio channels: 2 (stereo)
                temp_wav_path,  # Output file
            ]
            print(f"Running ffmpeg command: {' '.join(command)}")
            subprocess.run(command, check=True)
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=500, detail=f"Failed to convert audio to WAV format: {str(e)}")

        print(f"Converted WAV file path: {temp_wav_path}")

        # --- Calculate Audio Duration ---
        try:
            with wave.open(temp_wav_path, "rb") as wav_file:
                frame_rate = wav_file.getframerate()
                num_frames = wav_file.getnframes()
                duration = num_frames / float(frame_rate)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to calculate audio duration: {str(e)}")

        print(f"Audio Duration: {duration} seconds")

        # --- Transcribe Audio ---
        print("Transcribing audio using Whisper")
        transcription_result = whisper_model.transcribe(temp_wav_path)
        transcription = transcription_result.get("text", "").strip()
        if not transcription:
            raise ValueError("Whisper failed to generate a transcription.")

        print(f"Transcription: {transcription}")

        # --- Analyze Transcription with spaCy ---
        print("Analyzing transcription with spaCy")
        doc = nlp(transcription)
        sentences = list(doc.sents)

        # Extract spaCy statistics
        spacy_stats = {
            "num_tokens": len(doc),
            "tokens": [{"text": token.text, "pos": token.pos_, "dep": token.dep_, "head": token.head.text} for token in doc],
            "named_entities": [{"text": ent.text, "label": ent.label_} for ent in doc.ents],
            "noun_chunks": [{"text": chunk.text, "root": chunk.root.text, "root_dep": chunk.root.dep_} for chunk in doc.noun_chunks],
            "sentences": [{"text": sent.text, "length": len(sent)} for sent in sentences],
            "readability": calculate_readability(transcription, sentences),
            "delivery": analyze_delivery(transcription, doc, {"duration": duration}),
        }

        print(f"spaCy Stats: {spacy_stats}")

        print("COMPLETED: /process-audio endpoint")  # Log completion of endpoint

        return {
            "transcription": transcription,
            "expected_text": expected_text,
            "spacy_stats": spacy_stats,
        }

    except Exception as e:
        print(f"ERROR: /process-audio - {e}")
        raise HTTPException(status_code=500, detail="Failed to process audio file")
    finally:
        # Clean up temporary files
        if temp_audio_path and os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
        if temp_wav_path and os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)