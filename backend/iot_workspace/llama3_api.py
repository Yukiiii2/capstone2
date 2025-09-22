from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.iot_workspace.feedback_analyzer import FeedbackAnalyzer
import uuid
from supabase import create_client, Client  # Import Supabase client library
import whisper  # OpenAI Whisper for speech-to-text
import spacy  # spaCy for text analysis

import os
import tempfile
import wave

# Initialize Supabase client directly in this file
SUPABASE_URL = "https://ztlkzuslrokawaplrmnd.supabase.co"  # Replace with your Supabase URL
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bGt6dXNscm9rYXdhcGxybW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDgxNDcsImV4cCI6MjA2OTk4NDE0N30.232TtQIl00U-XdqMv3sJi8AUy3tjwMx5sgsWMlpHVoU"  # Replace with your Supabase anon key
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

app = FastAPI()
global_feedback = {}

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = FeedbackAnalyzer()
nlp = spacy.load("en_core_web_sm")  # Load spaCy model
whisper_model = whisper.load_model("base")  # Load OpenAI Whisper model

# Define the Pydantic model for the request body
class SpeechFeedbackRequest(BaseModel):
    student_id: str = None  # Optional field
    attempt_id: str = None  # Optional field
    speech_text: str
    spacy_stats: dict


@app.post("/analyze-feedback")
async def analyze_feedback(request: SpeechFeedbackRequest):
    """
    Endpoint to process JSON input, generate feedback, and store it in the database.
    """
    global global_feedback  # Declare the global variable
    try:
        # Check if the student_id exists in the profiles table
        student_check = supabase.table("profiles").select("id").eq("id", request.student_id).execute()
        if not student_check.data:  # Directly check the 'data' attribute
            raise HTTPException(status_code=400, detail=f"Student ID {request.student_id} does not exist in the profiles table")

        # Check if the attempt_id exists in the attempts table
        attempt_check = supabase.table("attempts").select("id").eq("id", request.attempt_id).execute()
        if not attempt_check.data:  # Directly check the 'data' attribute
            raise HTTPException(status_code=400, detail=f"Attempt ID {request.attempt_id} does not exist in the attempts table")

        speech_text = request.speech_text
        spacy_stats = request.spacy_stats

        # Generate feedback using the FeedbackAnalyzer
        result = analyzer.analyze_feedback(speech_text, spacy_stats)

        # Check if feedback was generated
        if not result or "feedback" not in result:
            raise HTTPException(status_code=500, detail="Failed to generate feedback")

        # Prepare feedback data for Supabase
        feedback_data = {
            "id": str(uuid.uuid4()),  # Generate a unique UUID for the feedback
            "student_id": request.student_id,
            "attempt_id": request.attempt_id,
            "evaluation": {
                "spacy_stats": spacy_stats,
                "feedback": result["feedback"]
            },
            "transcription": speech_text,
        }

        # Debugging: Log the feedback data
        print("Feedback Data to Insert:", feedback_data)

        # Insert feedback into the Supabase `feedback_ai` table
        response = supabase.table("feedback_ai").insert(feedback_data).execute()

        # Debugging: Log the Supabase response
        print("Supabase Response:", response)

        # Check if the insert operation was successful
        if not response.data:  # Check if 'data' is empty or None
            print("Supabase Insert Error:", response)
            raise HTTPException(status_code=500, detail="Failed to store feedback in the database")

        # Store feedback in the global variable
        global_feedback = feedback_data

        # Return the feedback along with the inserted record ID
        return {
            "id": feedback_data["id"],
            "speech_text": speech_text,
            "spacy_stats": spacy_stats,
            "feedback": result["feedback"]
        }

    except Exception as e:
        # Log the error and raise an HTTP exception
        print(f"Error in /analyze-feedback: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the feedback")


@app.get("/get-feedback/{feedback_id}")
async def get_feedback(feedback_id: str):
    """
    Endpoint to retrieve feedback by ID from the database.
    """
    try:
        # Query feedback from Supabase
        response = supabase.table("feedback_ai").select("*").eq("id", feedback_id).execute()

        # Check if the feedback exists
        if not response.data:
            raise HTTPException(status_code=404, detail="Feedback not found")

        return {"feedback": response.data[0]}

    except Exception as e:
        # Log the error and raise an HTTP exception
        print(f"Error in /get-feedback/{feedback_id}: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while retrieving the feedback")


@app.post("/process-audio")
async def process_audio(file: UploadFile = File(...)):
    """
    Endpoint to process a `.wav` audio file, transcribe it using OpenAI Whisper, and analyze the transcription with spaCy.
    """
    try:
        # Save the uploaded file to a persistent temporary location
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            temp_audio_path = tmp.name
            tmp.write(await file.read())
        print(f"Temporary audio file path: {temp_audio_path}")

        # Verify the audio file is a valid `.wav` file
        try:
            with wave.open(temp_audio_path, "rb") as wav_file:
                print(f"Audio file details: {wav_file.getparams()}")
        except wave.Error:
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
            raise HTTPException(status_code=400, detail="Invalid WAV file")

        # Ensure the temporary file exists before transcription
        if not os.path.exists(temp_audio_path):
            raise HTTPException(status_code=500, detail="Temporary audio file not found")

        # Transcribe the audio using OpenAI Whisper (pass path directly)
        try:
            transcription_result = whisper_model.transcribe(temp_audio_path)
            transcription = transcription_result["text"]
            print(f"Transcription: {transcription}")
        except Exception as e:
            print(f"Error during transcription: {e}")
            raise HTTPException(status_code=500, detail="Failed to transcribe audio file")
        finally:
            # Clean up temporary file after Whisper uses it
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)

        # Analyze the transcription using spaCy
        doc = nlp(transcription)
        spacy_stats = {
            "num_tokens": len(doc),
            "tokens": [{"text": token.text, "pos": token.pos_} for token in doc],
            "named_entities": [{"text": ent.text, "label": ent.label_} for ent in doc.ents],
            "readability": {
                "flesch_reading_ease": None,
                "avg_sentence_length": (
                    sum(len(sent) for sent in doc.sents) / len(list(doc.sents))
                    if doc.sents else None
                ),
            },
            "sentiment": {
                "polarity": None,
                "subjectivity": None,
            },
        }

        # Return the transcription and spaCy statistics
        return {
            "transcription": transcription,
            "spacy_analysis": spacy_stats,
        }

    except Exception as e:
        print(f"Error in /process-audio: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the audio file")

