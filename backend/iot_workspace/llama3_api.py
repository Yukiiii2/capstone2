from fastapi import FastAPI
from pydantic import BaseModel
from backend.iot_workspace.feedback_analyzer import FeedbackAnalyzer

app = FastAPI()
analyzer = FeedbackAnalyzer()

class FeedbackRequest(BaseModel):
    feedback: str
    device_stats: dict

@app.post("/analyze-feedback")
async def analyze_feedback(request: FeedbackRequest):
    result = analyzer.analyze_feedback(request.feedback, request.device_stats)
    return {"analysis": result}