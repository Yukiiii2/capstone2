from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.iot_workspace.feedback_analyzer import FeedbackAnalyzer
from supabase import create_client, Client
from fastapi import Request
from asyncio import CancelledError
from typing import Dict, Any
# Add to top of llama3_api.py
from datetime import datetime, timezone, timedelta

import statistics

import pandas as pd
import whisper
import spacy
import uuid
import os
import tempfile
import wave
import difflib

import re
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
class PreAssessmentRequest(BaseModel):
    student_id: str
    answers: list[int]

class SpeechFeedbackRequest(BaseModel):
    student_id: str | None = None
    attempt_id: str | None = None
    speech_text: str
    spacy_stats: dict
    expected_text: str | None = None  # Add expected_text here
    category: str | None = None  # e.g., "presentation", "reading", etc.
class ScriptRequest(BaseModel):
    lessonPrompt: str
    topic: str  # The topic for the script
    


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

@app.post("/process-pre-assessment")
async def process_pre_assessment(request: PreAssessmentRequest):
    """Process pre-assessment answers and generate initial confidence scores"""
    try:
        # Calculate initial averages
        speaking_questions = [0, 1, 2, 4]  # indices for speaking-related questions
        reading_questions = [3, 5]  # indices for reading-related questions

        speakingAvg = round(
            (sum(request.answers[i] for i in speaking_questions) / len(speaking_questions)) * 20
        )
        readingAvg = round(
            (sum(request.answers[i] for i in reading_questions) / len(reading_questions)) * 20
        )

        # Calculate initial anxiety levels (inverse of confidence)
        anxiety_speaking = round(100 - speakingAvg)
        anxiety_reading = round(100 - readingAvg)

        # Prepare prompt for Llama3
        prompt = f"""
        Analyze this student's pre-assessment results and suggest confidence scores.
        
        Assessment responses (1-5 scale):
        1. Public speaking confidence: {request.answers[0]}
        2. Anxiety management: {request.answers[1]}
        3. Thought organization: {request.answers[2]}
        4. Reading aloud confidence: {request.answers[3]}
        5. Impromptu speaking: {request.answers[4]}
        6. Overall satisfaction: {request.answers[5]}

        Initial calculations:
        Speaking average: {speakingAvg}/100
        Reading average: {readingAvg}/100

        Based on these responses, provide adjusted confidence scores that:
        1. Consider the psychological aspects of self-assessment
        2. Account for potential under/over estimation
        3. Provide a balanced starting point for improvement
        
        Respond in this exact format:
        speaking_score: [number]
        reading_score: [number]
        explanation: [brief analysis]
        """

        # Get Llama3 analysis - Remove await since analyze() isn't async
        analyzer = FeedbackAnalyzer()
        analysis = analyzer.llm.analyze(prompt)  # Removed await

        # Parse scores from Llama3 response
        speaking_match = re.search(r'speaking_score:\s*(\d+)', str(analysis).lower())
        reading_match = re.search(r'reading_score:\s*(\d+)', str(analysis).lower())

        speaking_score = min(100, max(0, int(speaking_match.group(1)))) if speaking_match else speakingAvg
        reading_score = min(100, max(0, int(reading_match.group(1)))) if reading_match else readingAvg

        # Store in confidence_anxiety_score table with schema-compliant data
        confidence_data = {
            "student_id": request.student_id,
            "confidence_score_speaking": speaking_score,
            "confidence_score_reading": reading_score,
            "anxiety_level_speaking": anxiety_speaking,
            "anxiety_level_reading": anxiety_reading,
            "total_speaking_attempts": 0,
            "total_reading_attempts": 0,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        # Execute Supabase insert without await since it's not async
        response = supabase.table("confidence_anxiety_score").insert(confidence_data).execute()

        if "error" in response:
            raise HTTPException(status_code=500, detail="Failed to save confidence scores")

        return {
            "success": True,
            "scores": {
                "speaking": speaking_score,
                "reading": reading_score,
                "anxiety_speaking": anxiety_speaking,
                "anxiety_reading": anxiety_reading
            },
            "analysis": str(analysis),  # Convert analysis to string
            "message": "Pre-assessment processed successfully"
        }

    except Exception as e:
        print(f"Error processing pre-assessment: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process pre-assessment: {str(e)}"
        )
@app.get("/analyze-confidence/{student_id}")
async def analyze_confidence(student_id: str):
    try:
            # Get current record
            current_scores = supabase.table("confidence_anxiety_score")\
                .select("*")\
                .eq("student_id", student_id)\
                .order("updated_at", desc=True)\
                .limit(1)\
                .execute()

            # Get current state
            if current_scores.data:
                base_speaking = current_scores.data[0]["confidence_score_speaking"]
                base_reading = current_scores.data[0]["confidence_score_reading"]
                last_feedback_id = current_scores.data[0].get("last_feedback_id")
                last_attempts_count = current_scores.data[0].get("total_speaking_attempts", 0)
                last_updated = current_scores.data[0]["updated_at"]
            else:
                base_speaking = 0
                base_reading = 0
                last_feedback_id = None
                last_attempts_count = 0
                last_updated = None

            # Get fresh data
            print(f"\nFetching fresh data for student {student_id}")
            feedback_response = supabase.table("feedback_ai").select("*").eq("student_id", student_id).execute()
            progress_response = supabase.table("student_progress").select("*").eq("student_id", student_id).execute()
            attempts_response = supabase.table("attempts").select("*").eq("student_id", student_id).execute()

            # Check for new activity
            current_attempts_count = len(attempts_response.data)
            latest_feedback_id = feedback_response.data[-1]["id"] if feedback_response.data else None
            completed_modules = sum(1 for p in progress_response.data if p.get('completed'))

            # If no new activity, return current scores
            if (current_attempts_count == last_attempts_count and 
                latest_feedback_id == last_feedback_id):
                print("No new activity detected, returning current scores")
                return {
                    "confidencescoreSpeaking": base_speaking,
                    "confidencescoreReading": base_reading,
                    "details": {
                        "cached": True,
                        "no_new_activity": True,
                        "last_updated": last_updated
                    }
                }

            print(f"New activity detected - Analyzing progress...")
            print(f"Previous scores - Speaking: {base_speaking}, Reading: {base_reading}")
            print(f"New attempts: {current_attempts_count - last_attempts_count}")

            # Prepare Llama 3 analysis with recent data
            recent_feedback = feedback_response.data[-3:] if feedback_response.data else []
            recent_attempts = attempts_response.data[-3:] if attempts_response.data else []

            analysis_prompt = f"""
            Analyze the student's recent progress and provide updated confidence scores.
            
            Current Status:
            - Previous Speaking Score: {base_speaking}/100
            - Previous Reading Score: {base_reading}/100
            - Last Updated: {last_updated}
            
            New Activity Since Last Update:
            1. Speaking Progress:
            - New attempts: {current_attempts_count - last_attempts_count}
            - Recent attempts feedback: {[f.get('evaluation') for f in recent_feedback if f.get('category') == 'speaking']}
            
            2. Reading Progress:
            - New feedback entries: {len([f for f in recent_feedback if f.get('category') == 'reading'])}
            - Recent reading feedback: {[f.get('evaluation') for f in recent_feedback if f.get('category') == 'reading']}

            Based on this new activity, provide updated confidence scores that:
            1. Cannot be lower than previous scores ({base_speaking} for speaking, {base_reading} for reading)
            2. Should show gradual improvement based on new activity
            3. Must be between previous score and 100

            Respond in this exact format:
            speaking_score: [number]
            reading_score: [number]
            explanation: [brief analysis of changes]
            """

            try:
                # Get Llama 3 analysis
                print("Requesting Llama 3 analysis...")
                analyzer = FeedbackAnalyzer()
                analysis_result = analyzer.llm.analyze(analysis_prompt)
                
                # Parse response
                import re
                speaking_match = re.search(r'speaking_score:\s*(\d+)', str(analysis_result).lower())
                reading_match = re.search(r'reading_score:\s*(\d+)', str(analysis_result).lower())
                
                if speaking_match and reading_match:
                    speaking_score = max(base_speaking, min(100, int(speaking_match.group(1))))
                    reading_score = max(base_reading, min(100, int(reading_match.group(1))))
                    print(f"Llama 3 scores - Speaking: {speaking_score}, Reading: {reading_score}")
                else:
                    raise ValueError("Could not parse Llama 3 scores")
                    
            except Exception as parse_error:
                print(f"Llama 3 analysis failed: {parse_error}, using fallback calculation")
                speaking_score = max(base_speaking, calculate_fallback_score('speaking', 
                    progress_response.data, 
                    feedback_response.data, 
                    attempts_response.data))
                reading_score = max(base_reading, calculate_fallback_score('reading',
                    progress_response.data,
                    feedback_response.data,
                    []))

            # Update record with new scores
            update_data = {
                "confidence_score_speaking": speaking_score,
                "confidence_score_reading": reading_score,
                "total_speaking_attempts": current_attempts_count,
                "total_reading_attempts": len([f for f in feedback_response.data if f.get('category') == 'reading']),
                "last_feedback_id": latest_feedback_id,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }

            if current_scores.data:
                print(f"Updating confidence score record for student {student_id}")
                supabase.table("confidence_anxiety_score")\
                    .update(update_data)\
                    .eq("student_id", student_id)\
                    .execute()
            else:
                print(f"Creating new confidence score record for student {student_id}")
                update_data["student_id"] = student_id
                supabase.table("confidence_anxiety_score")\
                    .insert(update_data)\
                    .execute()

            return {
                "confidencescoreSpeaking": speaking_score,
                "confidencescoreReading": reading_score,
                "details": {
                    "cached": False,
                    "previous_speaking": base_speaking,
                    "previous_reading": base_reading,
                    "new_attempts": current_attempts_count - last_attempts_count,
                    "new_feedback": latest_feedback_id != last_feedback_id,
                    "last_updated": update_data["updated_at"]
                }
            }

    except Exception as e:
            print(f"Error in analyze_confidence: {str(e)}")
            if current_scores and current_scores.data:
                return {
                    "confidencescoreSpeaking": current_scores.data[0]["confidence_score_speaking"],
                    "confidencescoreReading": current_scores.data[0]["confidence_score_reading"],
                    "details": {
                        "cached": True,
                        "error_fallback": True,
                        "last_updated": current_scores.data[0]["updated_at"]
                    }
                }
            raise HTTPException(status_code=500, detail=f"Failed to analyze confidence: {str(e)}")

def calculate_fallback_score(category: str, progress_data: list, feedback_data: list, attempts_data: list) -> int:
        """Fallback calculation if Llama 3 analysis fails"""
        
        # Weight distribution
        weights = {
            'completion': 0.4,  # 40% from module completion
            'feedback': 0.3,    # 30% from feedback scores
            'attempts': 0.3     # 30% from attempts data
        }
        
        # Calculate completion score
        relevant_progress = [p for p in progress_data if p.get('category') == category]
        completion_score = (
            sum(1 for p in relevant_progress if p.get('completed', False)) / 
            max(len(relevant_progress), 1)
        ) * 100
        
        # Calculate feedback score
        relevant_feedback = [f for f in feedback_data if f.get('category') == category]
        feedback_score = (
            sum(f.get('score', 0) for f in relevant_feedback) / 
            max(len(relevant_feedback), 1)
        ) if relevant_feedback else 0
        
        # Calculate attempts score (only for speaking)
        attempts_score = 0
        if category == 'speaking' and attempts_data:
            attempts_score = min(100, len(attempts_data) * 10)  # 10 points per attempt, max 100
        
        # Calculate weighted final score
        final_score = (
            completion_score * weights['completion'] +
            feedback_score * weights['feedback'] +
            attempts_score * weights['attempts']
        )
        
        return int(final_score)
    

@app.post("/analyze-feedback")
async def analyze_feedback(request: SpeechFeedbackRequest, req: Request):
    """
    Analyze feedback, including strengths, weaknesses, and suggestions.
    Compare the transcription with the expected text if provided.
    """
    try:
        # Step 1: Extract the Authorization header and fetch the user
        auth_header = req.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Unauthorized: Missing or invalid Authorization header")
        
        token = auth_header.split("Bearer ")[1]

        # Fetch the user from Supabase using the token
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid token")
        
        user = user_response.user
        student_id = user.id  # Extract the UUID of the logged-in user
        print(f"Student ID (UUID): {student_id}")

        # Step 2: Process the feedback
        print("Processing feedback...")
        speech_text = request.speech_text
        expected_text = request.expected_text  # Retrieve the expected text
        spacy_stats = request.spacy_stats
        category = request.category
        # Compare transcription with expected text if provided
        discrepancies = None
        if expected_text:
            discrepancies = compare_transcriptions(speech_text, expected_text)
            print(f"Discrepancies between transcription and expected text: {discrepancies}")

        # Generate feedback using FeedbackAnalyzer
        feedback_analyzer = FeedbackAnalyzer()
        feedback_result = feedback_analyzer.analyze_feedback(speech_text, spacy_stats)

        if "error" in feedback_result:
            raise HTTPException(status_code=500, detail=feedback_result["error"])

        # Extract the AI-generated feedback
        ai_feedback = feedback_result.get("feedback", "No feedback generated.")

        print(f"AI Feedback: {ai_feedback}")

        # Step 3: Prepare data for the `feedback_ai` table
        print("Preparing data for `feedback_ai` table...")
        attempt_id = str(uuid.uuid4())  # Generate a unique attempt ID
        feedback_data = {
            "student_id": student_id,
            "attempt_id": attempt_id,
            "evaluation": ai_feedback,
            "transcription": speech_text,
            "category": category,
        }

        # Step 4: Insert data into the `feedback_ai` table
        print("Inserting data into `feedback_ai` table...")
        response = supabase.table("feedback_ai").insert(feedback_data).execute()
        if not response.data:  # Check if the data attribute is empty
            print(f"Supabase Insert Error: {response.json()}")
            raise HTTPException(status_code=500, detail="Failed to save feedback details to the database.")

        print("Feedback details inserted successfully into `feedback_ai` table.")

        # Step 5: Return the feedback response
        return {
            "student_id": student_id,
            "speech_text": speech_text,
            "expected_text": expected_text,
            "discrepancies": discrepancies,  # Include discrepancies in the response
            "feedback_summary": {
                "word_count": len(speech_text.split()),
                "filler_words": spacy_stats.get("delivery", {}).get("filler_words", []),
                "repeated_words": spacy_stats.get("delivery", {}).get("repeated_words", []),
                "words_per_minute": spacy_stats.get("delivery", {}).get("words_per_minute", 0),
                "readability": spacy_stats.get("readability", {}),
                "named_entities": spacy_stats.get("named_entities", []),
            },
            "ai_feedback": ai_feedback,  # Include the paragraph-form feedback
            "message": "Feedback analyzed successfully.",
        }

    except HTTPException as e:
        print(f"ERROR: /analyze-feedback - {e.detail}")
        raise e
    except Exception as e:
        print(f"ERROR: /analyze-feedback - {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the feedback")
    
@app.post("/process-video")
async def process_video(file: UploadFile = File(...)):
    """
    Process uploaded video file → Extract facial features using OpenFace → Return analysis results.
    """
    print("START: /process-video endpoint")  # Log start of endpoint

    temp_video_path = None
    output_dir = None
    try:
        # --- Validate File Type ---
        print(f"Uploaded file: {file.filename}")
        if not file.filename.endswith((".mp4", ".avi", ".mov", ".mkv")):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload a valid video file.")

        # --- Save Uploaded File ---
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            temp_video_path = tmp.name
            tmp.write(await file.read())

        print(f"Temporary video file path: {temp_video_path}")

        # --- Create Temporary Output Directory ---
        output_dir = tempfile.mkdtemp()
        print(f"Temporary output directory: {output_dir}")

        # --- Run OpenFace FeatureExtraction ---
        try:
            command = [
                r"C:\OpenFace_2.2.0_win_x64\FeatureExtraction.exe",  # Path to OpenFace FeatureExtraction
                "-f", temp_video_path,  # Input video file
                "-out_dir", output_dir,  # Output directory
                "-2Dfp",  # Extract 2D facial landmarks
                "-3Dfp",  # Extract 3D facial landmarks
                "-pose",  # Extract head pose
                "-aus",  # Extract Action Units (facial expressions)
                "-gaze",  # Extract gaze direction
            ]
            print(f"Running OpenFace command: {' '.join(command)}")
            subprocess.run(command, check=True)
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=500, detail=f"Failed to process video with OpenFace: {str(e)}")

        # --- Verify Output Files ---
        output_file = os.path.join(output_dir, "processed", os.path.basename(temp_video_path).replace(".mp4", ".csv"))
        if not os.path.exists(output_file):
            raise HTTPException(
                status_code=500,
                detail="OpenFace did not generate an output file. Ensure the video contains a visible face and all required models are present.",
            )

        print(f"OpenFace output file: {output_file}")

        # Read the CSV file and parse the results
        
        df = pd.read_csv(output_file)
        results = df.to_dict(orient="records")  # Convert to a list of dictionaries

        print("COMPLETED: /process-video endpoint")  # Log completion of endpoint

        return {
            "message": "Video processed successfully.",
            "results": results,  # Return the parsed results
        }

    except Exception as e:
        print(f"ERROR: /process-video - {e}")
        raise HTTPException(status_code=500, detail="Failed to process video file")
    finally:
        # Clean up temporary files and directories
        if temp_video_path and os.path.exists(temp_video_path):
            os.remove(temp_video_path)
        if output_dir and os.path.exists(output_dir):
            import shutil
            shutil.rmtree(output_dir)
    
@app.post("/generate-script")
async def generate_script(request: ScriptRequest):
    """
    Generate a script for the user based on the lessonPrompt and topic.
    """
    try:
        # Log the incoming request data
        print("Received request to /generate-script")
        print(f"Lesson Prompt: {request.lessonPrompt}")
        print(f"Topic: {request.topic}")

        # Call the FeedbackAnalyzer to generate the script
        feedback_analyzer = FeedbackAnalyzer()
        script = feedback_analyzer.generate_script(
            lessonPrompt=request.lessonPrompt,
            topic=request.topic,
        )

        # Log the generated script
        print("Generated Script:")
        print(script)

        return {
            "lessonPrompt": request.lessonPrompt,
            "topic": request.topic,
            "script": script,
            "message": "Script generated successfully."
        }
    except ValueError as e:
        print(f"ValueError in /generate-script: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error in /generate-script: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate script: {str(e)}")

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