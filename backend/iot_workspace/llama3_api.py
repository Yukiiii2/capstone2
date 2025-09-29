from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.iot_workspace.feedback_analyzer import FeedbackAnalyzer
from supabase import create_client, Client

import whisper
import spacy
import uuid
import os
import tempfile
import wave
import difflib


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
@app.post("/analyze-feedback")
async def analyze_feedback(request: SpeechFeedbackRequest):
    """
    Analyze speech feedback, validate student/attempt IDs,
    generate evaluation, and store it in Supabase.
    """
    global global_feedback

    try:
        # --- Validate Student ID ---
        student_check = supabase.table("profiles").select("id").eq("id", request.student_id).execute()
        if not student_check.data:
            raise HTTPException(
                status_code=400,
                detail=f"Student ID {request.student_id} does not exist in the profiles table",
            )

        # --- Validate Attempt ID ---
        attempt_check = supabase.table("attempts").select("id").eq("id", request.attempt_id).execute()
        if not attempt_check.data:
            raise HTTPException(
                status_code=400,
                detail=f"Attempt ID {request.attempt_id} does not exist in the attempts table",
            )

        # --- Compare Transcription with Expected Text ---
        expected_text = "Ice cream, use cream, we all scream for ice cream."
        discrepancies = compare_transcriptions(request.speech_text, expected_text)

        # --- Generate Feedback ---
        feedback = "Your speech was clear and accurate."
        if discrepancies:
            feedback = "There were some discrepancies in your speech:\n"
            for discrepancy in discrepancies:
                if discrepancy.startswith("- "):
                    feedback += f"- Expected: {discrepancy[2:]}\n"
                elif discrepancy.startswith("+ "):
                    feedback += f"- Heard: {discrepancy[2:]}\n"

        # --- Prepare Feedback Data ---
        feedback_data = {
            "id": str(uuid.uuid4()),
            "student_id": request.student_id,
            "attempt_id": request.attempt_id,
            "evaluation": {
                "spacy_stats": request.spacy_stats,
                "feedback": feedback,
            },
            "transcription": request.speech_text,
        }

        print("Feedback Data to Insert:", feedback_data)

        # --- Store in Supabase ---
        response = supabase.table("feedback_ai").insert(feedback_data).execute()
        print("Supabase Response:", response)

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to store feedback in the database")

        # Save in global variable (temporary cache)
        global_feedback = feedback_data

        return {
            "id": feedback_data["id"],
            "speech_text": request.speech_text,
            "spacy_stats": request.spacy_stats,
            "feedback": feedback,
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in /analyze-feedback: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the feedback")


@app.get("/get-feedback/{feedback_id}")
async def get_feedback(feedback_id: str):
    """
    Retrieve stored feedback by feedback_id.
    """
    try:
        response = supabase.table("feedback_ai").select("*").eq("id", feedback_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Feedback not found")

        return {"feedback": response.data[0]}

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in /get-feedback/{feedback_id}: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while retrieving the feedback")


@app.post("/process-audio")
async def process_audio(file: UploadFile = File(...), expected_text: str = None):
    """
    Process uploaded audio file → Transcribe speech using Whisper → Compare with expected text → Extract statistics for /analyze-feedback.
    """
    temp_audio_path = None
    try:
        # --- Save Uploaded File ---
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            temp_audio_path = tmp.name
            tmp.write(await file.read())

        print(f"Temporary audio file path: {temp_audio_path}")

        # --- Log Audio File Details ---
        with wave.open(temp_audio_path, "rb") as wav_file:
            print(f"Audio file details: {wav_file.getparams()}")

        # --- Transcribe Audio ---
        transcription_result = whisper_model.transcribe(temp_audio_path)
        transcription = transcription_result["text"]

        print(f"Transcription: {transcription}")

        # --- Compare Transcription with Expected Text ---
        discrepancies = []
        if expected_text:
            discrepancies = compare_transcriptions(transcription, expected_text)
            print(f"Discrepancies: {discrepancies}")

        # --- Analyze Transcription with spaCy ---
        doc = nlp(transcription)

        # Calculate readability stats
        sentences = list(doc.sents)
        avg_sentence_length = sum(len(sent) for sent in sentences) / len(sentences) if sentences else None

        # Prepare spacy_stats
        spacy_stats = {
            "num_tokens": len(doc),
            "tokens": [{"text": token.text, "pos": token.pos_} for token in doc],
            "named_entities": [{"text": ent.text, "label": ent.label_} for ent in doc.ents],
            "readability": {
                "flesch_reading_ease": None,  # Optional: Add a library for this if needed
                "avg_sentence_length": avg_sentence_length,
            },
            "sentiment": {
                "polarity": None,  # Optional: Add sentiment analysis if needed
                "subjectivity": None,
            },
        }

        print(f"spaCy Stats: {spacy_stats}")

        return {
            "transcription": transcription,
            "expected_text": expected_text,
            "discrepancies": discrepancies,
            "spacy_stats": spacy_stats,
        }

    except Exception as e:
        print(f"Error in /process-audio: {e}")
        raise HTTPException(status_code=500, detail="Failed to process audio file")
    finally:
        if temp_audio_path and os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)