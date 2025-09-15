from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.iot_workspace.feedback_analyzer import FeedbackAnalyzer

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = FeedbackAnalyzer()

class FeedbackRequest(BaseModel):
    feedback: str
    device_stats: dict

@app.post("/analyze-feedback")
async def analyze_feedback(request: FeedbackRequest):
    result = analyzer.analyze_feedback(request.feedback, request.device_stats)
    return {"analysis": result}