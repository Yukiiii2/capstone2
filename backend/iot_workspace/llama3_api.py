from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.iot_workspace.feedback_analyzer import FeedbackAnalyzer

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
    speech_text: str
    spacy_stats: dict
    feedback: str = None  # Optional field
    device_stats: dict = None  # Optional field

@app.post("/analyze-feedback")
async def analyze_feedback(request: SpeechFeedbackRequest):
    """Endpoint to process JSON input and return feedback."""
    speech_text = request.speech_text
    spacy_stats = request.spacy_stats

    # Generate feedback using the FeedbackAnalyzer
    result = analyzer.analyze_feedback(speech_text, spacy_stats)

    return {
        "speech_text": speech_text,
        "spacy_stats": spacy_stats,
        "feedback": result["feedback"],
        "device_stats": result.get("device_stats", {})
    }