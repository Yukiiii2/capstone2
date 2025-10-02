from fastapi import FastAPI, Form, File, UploadFile, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import requests
import os

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up templates directory
templates = Jinja2Templates(directory="templates")

# Serve static files (e.g., CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Base URL for the backend API
API_BASE_URL = "https://unbalanceable-lyman-microstomatous.ngrok-free.dev"


@app.get("/", response_class=HTMLResponse)
async def render_practice_page(request: Request):
    """
    Render the practice page with a file upload form.
    """
    return templates.TemplateResponse("practice.html", {"request": request})


@app.post("/analyze-audio", response_class=HTMLResponse)
async def analyze_audio(
    request: Request,
    file: UploadFile = File(...),
    student_id: str = Form(...),
    attempt_id: str = Form(...),
):
    """
    Handle audio file upload, call process-audio and analyze-feedback endpoints, and display the results.
    """
    try:
        # --- Step 1: Call /process-audio ---
        process_audio_url = f"{API_BASE_URL}/process-audio"
        form_data = {"expected_text": "I Scream You Scream We all Scream For Ice Cream"}
        files = {"file": (file.filename, await file.read())}

        process_audio_response = requests.post(process_audio_url, data=form_data, files=files)
        if process_audio_response.status_code != 200:
            return templates.TemplateResponse(
                "practice.html",
                {
                    "request": request,
                    "error": f"Error in /process-audio: {process_audio_response.json()}",
                },
            )

        process_audio_data = process_audio_response.json()

        # --- Step 2: Call /analyze-feedback ---
        analyze_feedback_url = f"{API_BASE_URL}/analyze-feedback"
        analyze_feedback_payload = {
            "student_id": student_id,
            "attempt_id": attempt_id,
            "speech_text": process_audio_data["transcription"],
            "spacy_stats": process_audio_data["spacy_stats"],
        }

        analyze_feedback_response = requests.post(analyze_feedback_url, json=analyze_feedback_payload)
        if analyze_feedback_response.status_code != 200:
            return templates.TemplateResponse(
                "practice.html",
                {
                    "request": request,
                    "error": f"Error in /analyze-feedback: {analyze_feedback_response.json()}",
                },
            )

        feedback_data = analyze_feedback_response.json()

        # Render the results
        return templates.TemplateResponse(
            "practice.html",
            {
                "request": request,
                "transcription": process_audio_data["transcription"],
                "spacy_stats": process_audio_data["spacy_stats"],
                "feedback": feedback_data["feedback"],
            },
        )

    except Exception as e:
        return templates.TemplateResponse(
            "practice.html",
            {"request": request, "error": f"An error occurred: {str(e)}"},
        )