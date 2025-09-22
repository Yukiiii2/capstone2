from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.iot_workspace.feedback_analyzer import FeedbackAnalyzer
from lib.supabaseClient import supabase  # Import the Supabase client
import uuid

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = FeedbackAnalyzer()

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
    try:
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
        print("Supabase Insert Response:", response)

        # Check if the insert operation was successful
        if response.status_code != 201:
            print("Supabase Insert Error:", response)
            raise HTTPException(status_code=500, detail=f"Failed to store feedback in the database: {response}")

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
        if response.status_code != 200 or not response.data:
            raise HTTPException(status_code=404, detail="Feedback not found")

        return {"feedback": response.data[0]}

    except Exception as e:
        # Log the error and raise an HTTP exception
        print(f"Error in /get-feedback/{feedback_id}: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while retrieving the feedback")
    

    