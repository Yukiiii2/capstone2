from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.iot_workspace.feedback_analyzer import FeedbackAnalyzer
from supabase import create_client, Client
from fastapi import Request
from asyncio import CancelledError
from typing import Dict, Any, Optional  # Add Optional here
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
import asyncio
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException




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
    # Add new request model
class FullAnalysisRequest(BaseModel):
    feedback: str
    speech_text: str
    category: str
    student_id: str
    module_id: str  # Make this required
    attempt_id: Optional[str] = None
    session_id: Optional[str] = None

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
    
async def store_ai_analysis_scores(
    student_id: str,
    module_id: str,
    skills_data: dict,
    metrics: dict,
    confidence_score: int,
    attempt_id: Optional[str] = None,
    session_id: Optional[str] = None
) -> dict:
    """Store AI analysis scores in the full_analysis_scores table"""
    try:
        scores_data = {
            "student_id": student_id,
            "module_id": module_id,
            "speaking_pace": round(skills_data.get("Speaking Pace", {}).get("score", 70)),
            "filler_words_score": round(skills_data.get("Filler Words", {}).get("score", 70)),
            "clarity_score": round(skills_data.get("Clarity & Pronunciation", {}).get("score", 70)),
            "vocabulary_score": round(metrics.get("vocabulary_diversity", 70)),
            "grammar_score": round(metrics.get("grammar_score", 70)),
            "pause_score": round(metrics.get("pause_score", 70)),
            "overall_confidence": round(confidence_score),
            "attempt_id": attempt_id,
            "session_id": session_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        response = supabase.table("full_analysis_scores").insert(scores_data).execute()
        
        if "error" in response:
            raise Exception(f"Failed to store analysis scores: {response.get('error')}")
            
        return response.data[0]

    except Exception as e:
        print(f"Error storing analysis scores: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to store analysis scores: {str(e)}")

@app.post("/full-analysis")
async def full_analysis(request: FullAnalysisRequest):
    """Generate comprehensive speech analysis with detailed metrics"""
    try:
        # Process text and calculate base metrics
        doc = nlp(request.speech_text)
        speech_metrics = calculate_speech_metrics(request.speech_text, doc, 180)
        language_metrics = calculate_language_metrics(doc)

        # Initialize scores with default values from calculated metrics
        scores = {
            'speaking_pace': speech_metrics["speaking_pace"]["score"],
            'clarity_score': language_metrics["clarity"]["score"],
            'filler_words_score': speech_metrics["filler_words"]["score"],
            'vocabulary_score': language_metrics["vocabulary"]["score"],
            'grammar_score': 70,
            'pause_score': speech_metrics["pauses"]["score"]
        }

        # Create analysis prompt for Llama
        analysis_prompt = f"""
        Analyze this speaking performance with current metrics:

        Speech Text: {request.speech_text}

        Current Metrics:
        - Speaking Pace: {speech_metrics["speaking_pace"]["wpm"]} WPM
        - Filler Words: {speech_metrics["filler_words"]["count"]} instances
        - Clarity Score: {language_metrics["clarity"]["readability_score"]}
        - Vocabulary Score: {language_metrics["vocabulary"]["diversity_score"]}

        Rate each category from 0-100 and explain why:
        1. Speaking Pace (ideal is 120-150 words per minute)
        2. Filler Words Usage (um, uh, like, etc.)
        3. Clarity & Pronunciation
        4. Vocabulary Diversity
        5. Grammar Accuracy
        6. Pause Usage & Timing

        Format response exactly as:
        speaking_pace: [score]
        filler_words: [score]
        clarity: [score]
        vocabulary: [score]
        grammar: [score]
        pause_usage: [score]
        explanation: [brief analysis of each score]
        """

        # Get Llama analysis with timeout
        try:
            analysis_result = await asyncio.wait_for(
                asyncio.to_thread(analyzer.llm.analyze, analysis_prompt),
                timeout=30.0
            )
            print(f"Raw Llama analysis: {analysis_result}")  # Debug log
            
            # Update scores with Llama analysis if available
            for line in str(analysis_result).split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip()
                    try:
                        if key in ['speaking_pace', 'filler_words', 'clarity', 'vocabulary', 'grammar', 'pause_usage']:
                            value = int(float(value.strip()))
                            if 0 <= value <= 100:
                                scores[key.replace('_usage', '_score')] = value
                    except ValueError:
                        continue

        except Exception as e:
            print(f"Llama analysis failed: {e}")
            # scores will keep their default values from metrics

        print(f"Final scores: {scores}")  # Debug log

        # Store analysis in database
        analysis_record = {
            "student_id": request.student_id,
            "module_id": request.module_id,
            "attempt_id": request.attempt_id,
            "session_id": request.session_id,
            "speaking_pace": scores['speaking_pace'],
            "clarity_score": scores['clarity_score'],  # Using correct column name
            "filler_words_score": scores['filler_words_score'],
            "vocabulary_score": scores['vocabulary_score'],
            "grammar_score": scores['grammar_score'],
            "pause_score": scores['pause_score'],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        stored = supabase.table("full_analysis_scores").insert(analysis_record).execute()

        return {
            "success": True,
            "speaking_pace": scores['speaking_pace'],
            "clarity_score": scores['clarity_score'],
            "filler_words_score": scores['filler_words_score'],
            "vocabulary_score": scores['vocabulary_score'],
            "grammar_score": scores['grammar_score'],
            "pause_score": scores['pause_score'],
            "analysis": {
                "speech_delivery": speech_metrics,
                "language_clarity": language_metrics
            }
        }

    except Exception as e:
        print(f"Error in full analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
def extract_suggestions(skills_data: dict) -> list:
    """Extract all improvement suggestions from skills data"""
    suggestions = []
    for skill, data in skills_data.items():
        if 'suggestions' in data:
            suggestions.append({
                'skill': skill,
                'suggestion': data['suggestions']
            })
    return suggestions
def generate_fallback_analysis(feedback: str, speech_text: str) -> dict:
    """Generate fallback analysis when LLM analysis fails"""
    try:
        # Basic text analysis
        words = speech_text.split()
        word_count = len(words)
        
        # Calculate basic metrics
        filler_words = ["um", "uh", "like", "you know", "well"]
        filler_count = sum(1 for word in words if word.lower() in filler_words)
        filler_ratio = (filler_count / word_count) if word_count > 0 else 0
        
        # Generate fallback skills data
        skills_data = {
            "Speaking Pace": {
                "score": 70,
                "observation": "Default pace assessment",
                "tip": "Maintain a steady speaking rhythm"
            },
            "Clarity & Pronunciation": {
                "score": max(0, 100 - (filler_ratio * 100)),
                "observation": f"Found {filler_count} filler words",
                "tip": "Focus on reducing filler words"
            },
            "Voice Quality": {
                "score": 75,
                "observation": "Basic voice assessment",
                "tip": "Practice voice projection"
            },
            "Language Usage": {
                "score": 70,
                "observation": "Default language assessment",
                "tip": "Continue practicing clear speech"
            }
        }
        
        return {
            "skills_data": skills_data,
            "analysis": "Fallback analysis generated due to processing limitations."
        }
        
    except Exception as e:
        print(f"Error in fallback analysis: {e}")
        return generate_default_skills()
    
def generate_default_skills() -> dict:
    """Generate default skills data when analysis fails"""
    return {
        "Speaking Pace": {
            "name": "Speaking Pace",
            "score": 70,
            "observation": "Default pace assessment needed",
            "tip": "Aim for 120-150 words per minute"
        },
        "Clarity & Pronunciation": {
            "name": "Clarity & Pronunciation",
            "score": 70,
            "observation": "Initial clarity assessment needed",
            "tip": "Focus on clear enunciation"
        },
        "Filler Words": {
            "name": "Filler Words",
            "score": 70,
            "observation": "Filler word analysis needed",
            "tip": "Be mindful of using um, uh, and like"
        },
        "Voice Quality": {
            "name": "Voice Quality",
            "score": 70,
            "observation": "Voice quality assessment needed",
            "tip": "Practice varying tone and volume"
        },
        "Language Usage": {
            "name": "Language Usage",
            "score": 70,
            "observation": "Language assessment needed",
            "tip": "Focus on clear and concise expression"
        }
    }

async def get_previous_score(student_id: str) -> int:
    """Get student's previous confidence score"""
    try:
        response = supabase.table("confidence_anxiety_score")\
            .select("confidence_score_speaking")\
            .eq("student_id", student_id)\
            .order("updated_at", desc=True)\
            .limit(1)\
            .execute()
        
        if response.data:
            return response.data[0].get("confidence_score_speaking", 70)
        return 70  # Default starting score
        
    except Exception as e:
        print(f"Error getting previous score: {e}")
        return 70
def extract_top_skills(skills_data: dict, limit: int = 2) -> list:
    """Extract top performing skills based on scores"""
    sorted_skills = sorted(
        [
            {"name": name, **data} 
            for name, data in skills_data.items()
        ],
        key=lambda x: x.get('score', 0),
        reverse=True
    )
    
    return [
        {
            "skill": skill["name"],
            "score": skill["score"],
            "observation": skill.get("observation", ""),
            "tip": skill.get("tip", "")
        }
        for skill in sorted_skills[:limit]
    ]
async def get_historical_context(student_id: str) -> str:
    """
    Fetch and format historical speech analysis data for a student.
    
    Args:
        student_id (str): The unique identifier for the student
        
    Returns:
        str: A formatted string containing historical context
    """
    try:
        # Fetch recent feedback entries
        feedback_response = supabase.table("feedback_ai")\
            .select("*")\
            .eq("student_id", student_id)\
            .order("created_at", desc=True)\
            .limit(3)\
            .execute()

        # Fetch confidence scores
        confidence_response = supabase.table("confidence_anxiety_score")\
            .select("*")\
            .eq("student_id", student_id)\
            .order("updated_at", desc=True)\
            .limit(1)\
            .execute()

        # Format historical context
        context_parts = []

        # Add confidence score context
        if confidence_response.data:
            latest_scores = confidence_response.data[0]
            context_parts.append(
                f"Current confidence levels: Speaking {latest_scores.get('confidence_score_speaking', 0)}/100, "
                f"Reading {latest_scores.get('confidence_score_reading', 0)}/100"
            )

        # Add recent feedback context
        if feedback_response.data:
            context_parts.append("Recent feedback summary:")
            for entry in feedback_response.data:
                evaluation = entry.get("evaluation", "").strip()
                if evaluation:
                    # Truncate long feedback entries
                    if len(evaluation) > 100:
                        evaluation = evaluation[:97] + "..."
                    context_parts.append(f"- {evaluation}")

        # If no historical data found
        if not context_parts:
            return "No previous speech analysis data available."

        return "\n".join(context_parts)

    except Exception as e:
        print(f"Error fetching historical context: {e}")
        return "Unable to retrieve historical context."

def extract_bottom_skills(skills_data: dict, limit: int = 2) -> list:
    """Extract skills that need the most improvement"""
    sorted_skills = sorted(
        [
            {"name": name, **data} 
            for name, data in skills_data.items()
        ],
        key=lambda x: x.get('score', 0)
    )
    
    return [
        {
            "skill": skill["name"],
            "score": skill["score"],
            "observation": skill.get("observation", ""),
            "tip": skill.get("tip", "")
        }
        for skill in sorted_skills[:limit]
    ]

def generate_focused_tips(skills_data: dict, metrics: dict) -> list:
    """Generate focused improvement tips based on skills and metrics"""
    tips = []
    
    # Add pace-related tip if needed
    wpm = metrics.get("words_per_minute", 0)
    if wpm < 120 or wpm > 150:
        tips.append({
            "category": "Speaking Pace",
            "tip": get_pace_tip(wpm)
        })
    
    # Add clarity-related tip if needed
    clarity_score = metrics.get("clarity_score", 0)
    if clarity_score < 85:
        tips.append({
            "category": "Clarity",
            "tip": get_clarity_suggestion(clarity_score)
        })
    
    # Add filler words tip if needed
    if metrics.get("filler_frequency", 0) > 5:
        tips.append({
            "category": "Filler Words",
            "tip": "Practice reducing filler words like 'um', 'uh', and 'like'"
        })
    
    # Add voice quality tips
    voice_suggestions = get_voice_suggestions(metrics)
    if voice_suggestions:
        tips.extend([
            {"category": "Voice Quality", "tip": suggestion}
            for suggestion in voice_suggestions
        ])
    
    return tips[:3]  # Return top 3 most important tips

def generate_fallback_response() -> dict:
    """Generate a fallback response when analysis fails"""
    return {
        "success": True,
        "confidence_score": 70,
        "core_metrics": {
            "speaking_pace": {
                "score": 70,
                "target": "120-150 words per minute",
                "status": "Needs Assessment",
                "tip": "Try to maintain a steady speaking pace"
            },
            "clarity": {
                "score": 70,
                "issues": [],
                "improvement": "Focus on clear pronunciation"
            },
            "filler_words": {
                "count": 0,
                "common": [],
                "frequency": "0%"
            },
            "voice_quality": {
                "volume_score": 70,
                "pitch_score": 70,
                "suggestions": ["Practice with varying tone and volume"]
            },
            "language": {
                "grammar_score": 70,
                "vocabulary_score": 70,
                "top_issues": []
            }
        },
        "progress": {
            "previous_score": 70,
            "improvement": {"change": 0, "trend": "stable"},
            "practice_streak": {"current_streak": 0, "best_streak": 0},
            "top_growth": {"skill": "Overall Speaking", "improvement": 0}
        },
        "key_strengths": [],
        "focus_areas": [
            {
                "skill": "Speaking Practice",
                "score": 70,
                "observation": "Initial assessment needed",
                "tip": "Complete more speaking exercises for personalized feedback"
            }
        ],
        "practice_tips": [
            {
                "category": "Getting Started",
                "tip": "Complete more speaking exercises to receive personalized feedback"
            }
        ]
    }
def calculate_improvement(student_id: str, current_score: int) -> dict:
    """Calculate improvement metrics"""
    try:
        # Get historical scores
        response = supabase.table("confidence_anxiety_score")\
            .select("confidence_score_speaking, updated_at")\
            .eq("student_id", student_id)\
            .order("updated_at", asc=True)\
            .execute()
        
        if not response.data:
            return {"change": 0, "trend": "stable"}
            
        scores = [entry.get("confidence_score_speaking", 0) for entry in response.data]
        
        # Calculate changes
        last_score = scores[-1] if scores else 0
        score_change = current_score - last_score
        
        # Determine trend
        if score_change > 5:
            trend = "improving"
        elif score_change < -5:
            trend = "declining"
        else:
            trend = "stable"
            
        return {
            "change": score_change,
            "trend": trend,
            "history": scores[-5:] if len(scores) > 5 else scores
        }
        
    except Exception as e:
        print(f"Error calculating improvement: {e}")
        return {"change": 0, "trend": "stable"}

async def get_practice_streak(student_id: str) -> dict:
    """Calculate student's practice streak"""
    try:
        # Get recent attempts
        response = supabase.table("attempts")\
            .select("created_at")\
            .eq("student_id", student_id)\
            .order("created_at", desc=True)\
            .execute()
            
        if not response.data:
            return {"current_streak": 0, "best_streak": 0}
            
        # Convert dates to datetime objects
        dates = [datetime.fromisoformat(entry["created_at"].replace("Z", "+00:00")) 
                for entry in response.data]
        
        # Calculate current streak
        current_streak = 0
        today = datetime.now(timezone.utc)
        
        for i, date in enumerate(dates):
            if i == 0 and (today - date).days > 1:
                break
            if i > 0 and (dates[i-1] - date).days > 1:
                break
            current_streak += 1
            
        # Calculate best streak
        best_streak = current_streak
        temp_streak = 0
        
        for i in range(len(dates)):
            if i == 0 or (dates[i-1] - dates[i]).days <= 1:
                temp_streak += 1
            else:
                best_streak = max(best_streak, temp_streak)
                temp_streak = 1
                
        return {
            "current_streak": current_streak,
            "best_streak": best_streak
        }
        
    except Exception as e:
        print(f"Error calculating practice streak: {e}")
        return {"current_streak": 0, "best_streak": 0}

def identify_most_improved(student_id: str, current_skills: dict) -> dict:
    """Identify most improved speaking skills"""
    try:
        # Get previous skills assessment
        response = supabase.table("full_analysis_queue")\
            .select("analysis_result")\
            .eq("student_id", student_id)\
            .order("processed_at", desc=True)\
            .limit(1)\
            .execute()
            
        if not response.data:
            return {"skill": "Overall Speaking", "improvement": 0}
            
        previous_skills = response.data[0].get("analysis_result", {}).get("skills_data", {})
        
        # Calculate improvements
        improvements = {}
        for skill, data in current_skills.items():
            previous_score = previous_skills.get(skill, {}).get("score", 0)
            current_score = data.get("score", 0)
            improvement = current_score - previous_score
            improvements[skill] = improvement
            
        # Find most improved skill
        if improvements:
            most_improved = max(improvements.items(), key=lambda x: x[1])
            return {
                "skill": most_improved[0],
                "improvement": most_improved[1]
            }
            
        return {"skill": "Overall Speaking", "improvement": 0}
        
    except Exception as e:
        print(f"Error identifying most improved skill: {e}")
        return {"skill": "Overall Speaking", "improvement": 0}
# ...existing code...    
def format_metrics(skills_data: dict, speech_text: str) -> list:
    """Format metrics with enhanced calculations"""
    words = speech_text.split()
    filler_words = len([w for w in words if w.lower() in ["um", "uh", "like"]])
    filler_ratio = (filler_words / len(words)) if words else 0

    return [
        {
            "label": "Fluency Score",
            "value": skills_data.get("Fluency", {}).get("score", 70),
            "icon": "bar-chart",
            "trend": skills_data.get("Fluency", {}).get("trend", "up"),
            "change": calculate_change(skills_data, "Fluency")
        },
        {
            "label": "Clarity Precision",
            "value": skills_data.get("Clarity and Pronunciation", {}).get("score", 75),
            "icon": "volume-high",
            "trend": skills_data.get("Clarity and Pronunciation", {}).get("trend", "up"),
            "change": calculate_change(skills_data, "Clarity and Pronunciation")
        },
        {
            "label": "Filler Word Reduction",
            "value": max(0, min(100, 100 - (filler_ratio * 1000))),
            "icon": "time",
            "trend": "up",
            "change": 0.8
        },
        {
            "label": "Speaking Rate (WPM)",
            "value": skills_data.get("Speaking Rate", {}).get("score", 70),
            "icon": "pulse",
            "trend": skills_data.get("Speaking Rate", {}).get("trend", "up"),
            "change": calculate_change(skills_data, "Speaking Rate")
        }
    ]

def get_top_skills(skills_data: dict, threshold: int = 65) -> list:
    """Get top performing skills above threshold"""
    return [
        {
            "skill": skill,
            "level": data["score"],
            "trend": data["trend"],
            "explanation": data.get("explanation", ""),
            "suggestions": data.get("suggestions", "")
        }
        for skill, data in skills_data.items()
        if data["score"] >= threshold
    ]

def get_bottom_skills(skills_data: dict, threshold: int = 65) -> list:
    """Get skills needing improvement below threshold"""
    return [
        {
            "skill": skill,
            "level": data["score"],
            "trend": data["trend"],
            "explanation": data.get("explanation", ""),
            "suggestions": data.get("suggestions", "")
        }
        for skill, data in skills_data.items()
        if data["score"] < threshold
    ]

def calculate_change(skills_data: dict, skill_name: str) -> float:
    """Calculate the change/improvement rate for a skill"""
    base_changes = {
        "Fluency": 2.0,
        "Clarity and Pronunciation": 1.2,
        "Speaking Rate": 0.6
    }
    trend = skills_data.get(skill_name, {}).get("trend", "up")
    return base_changes.get(skill_name, 1.0) * (1 if trend == "up" else -1)

# Add these helper functions after the existing imports

def process_speaking_metrics(speech_text: str) -> dict:
    """Calculate detailed speaking metrics from speech text"""
    try:
        words = speech_text.split()
        word_count = len(words)
        
        # Calculate words per minute (assuming average speaking duration)
        words_per_minute = word_count * (60 / 180)  # Assuming 3 minutes average
        
        # Count filler words
        filler_words = ["um", "uh", "like", "you know", "well", "so"]
        filler_count = sum(1 for word in words if word.lower() in filler_words)
        common_fillers = [word for word in words if word.lower() in filler_words]
        filler_frequency = (filler_count / word_count) * 100 if word_count > 0 else 0
        
        # Calculate clarity score
        doc = nlp(speech_text)
        clarity_score = 100 - (filler_frequency * 2)  # Reduce score based on filler words
        unclear_words = [token.text for token in doc if token.is_stop or token.like_num]
        
        # Calculate voice metrics (placeholder values since we can't actually measure audio)
        volume_consistency = 85  # Placeholder
        pitch_variation = 75    # Placeholder
        
        # Calculate vocabulary diversity
        unique_words = len(set(word.lower() for word in words))
        vocabulary_diversity = (unique_words / word_count * 100) if word_count > 0 else 0
        
        # Grammar analysis
        grammar_issues = []
        grammar_score = 85  # Placeholder - would need actual grammar checking
        
        return {
            "words_per_minute": words_per_minute,
            "clarity_score": clarity_score,
            "filler_count": filler_count,
            "common_fillers": common_fillers[:5],  # Top 5 most common fillers
            "filler_frequency": filler_frequency,
            "volume_consistency": volume_consistency,
            "pitch_variation": pitch_variation,
            "vocabulary_diversity": vocabulary_diversity,
            "grammar_score": grammar_score,
            "grammar_issues": grammar_issues,
            "unclear_words": unclear_words[:5]  # Top 5 unclear words
        }
    except Exception as e:
        print(f"Error processing speaking metrics: {e}")
        return generate_default_metrics()

def parse_focused_skills(analysis_text: str) -> dict:
    """Parse the analysis text into structured skill data"""
    skills_data = {}
    current_skill = None
    
    try:
        lines = analysis_text.strip().split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if line.startswith('skill:'):
                if current_skill:
                    skills_data[current_skill['name']] = current_skill
                current_skill = {
                    'name': line.split(':', 1)[1].strip(),
                    'score': 70,
                    'observation': '',
                    'tip': ''
                }
            elif current_skill:
                if line.startswith('score:'):
                    try:
                        score = int(line.split(':', 1)[1].strip())
                        current_skill['score'] = min(100, max(0, score))
                    except ValueError:
                        current_skill['score'] = 70
                elif line.startswith('observation:'):
                    current_skill['observation'] = line.split(':', 1)[1].strip()
                elif line.startswith('tip:'):
                    current_skill['tip'] = line.split(':', 1)[1].strip()
                    
        if current_skill:
            skills_data[current_skill['name']] = current_skill
            
        return skills_data
    except Exception as e:
        print(f"Error parsing skills: {e}")
        return generate_default_skills()

def calculate_weighted_confidence(skills_data: dict) -> int:
    """Calculate weighted confidence score from skills data"""
    weights = {
        "Speaking Pace": 0.25,
        "Clarity & Pronunciation": 0.25,
        "Filler Words": 0.20,
        "Voice Quality": 0.15,
        "Language Usage": 0.15
    }
    
    weighted_sum = 0
    total_weight = 0
    
    for skill, data in skills_data.items():
        weight = weights.get(skill, 0.1)  # Default weight 0.1 for unknown skills
        weighted_sum += data['score'] * weight
        total_weight += weight
    
    return round(weighted_sum / total_weight) if total_weight > 0 else 70

def get_pace_rating(wpm: float) -> str:
    """Get rating for speaking pace"""
    if 120 <= wpm <= 150:
        return "Ideal"
    elif 100 <= wpm < 120 or 150 < wpm <= 170:
        return "Good"
    elif wpm < 100:
        return "Too Slow"
    else:
        return "Too Fast"

def get_pace_tip(wpm: float) -> str:
    """Get improvement tip based on speaking pace"""
    if wpm < 100:
        return "Try to speak a bit faster while maintaining clarity"
    elif wpm > 170:
        return "Slow down slightly to improve understanding"
    elif 150 < wpm <= 170:
        return "Good pace, but could be slightly slower for better clarity"
    elif 100 <= wpm < 120:
        return "Good pace, but could be slightly faster for better engagement"
    else:
        return "Excellent pace! Keep maintaining this speed"

def get_clarity_suggestion(score: float) -> str:
    """Get suggestion for improving clarity"""
    if score >= 90:
        return "Excellent clarity - maintain this level"
    elif score >= 80:
        return "Good clarity - focus on consistent pronunciation"
    elif score >= 70:
        return "Decent clarity - practice enunciating difficult words"
    else:
        return "Focus on speaking more clearly and reducing filler words"

def get_voice_suggestions(metrics: dict) -> list:
    """Get suggestions for voice quality improvement"""
    suggestions = []
    
    if metrics['volume_consistency'] < 80:
        suggestions.append("Work on maintaining consistent volume")
    if metrics['pitch_variation'] < 70:
        suggestions.append("Try varying your tone more for emphasis")
    if len(metrics['common_fillers']) > 3:
        suggestions.append("Practice reducing filler words")
        
    return suggestions[:2]  # Return top 2 suggestions

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

# Add at the top with other imports
import asyncio
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

# Add global exception handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(exc.detail)}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": "Invalid request parameters"}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    print(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

def calculate_speech_metrics(speech_text: str, doc: spacy.tokens.Doc, duration: float) -> dict:
    """Calculate detailed speech metrics"""
    words = speech_text.split()
    word_count = len(words)
    wpm = word_count / (duration / 60) if duration > 0 else 0
    
    # Analyze pauses using punctuation and spacing
    pauses = len([t for t in doc if t.text in ['.', ',', ';', '...'] or t.is_space])
    pause_ratio = pauses / word_count if word_count > 0 else 0
    
    # Filler word analysis
    filler_words = ["um", "uh", "like", "you know", "well", "so"]
    filler_count = sum(1 for word in words if word.lower() in filler_words)
    
    return {
        "speaking_pace": {
            "wpm": round(wpm, 2),
            "target_range": "120-150",
            "score": calculate_pace_score(wpm)
        },
        "pauses": {
            "count": pauses,
            "ratio": round(pause_ratio * 100, 2),
            "score": calculate_pause_score(pause_ratio)
        },
        "filler_words": {
            "count": filler_count,
            "ratio": round((filler_count / word_count * 100), 2) if word_count > 0 else 0,
            "instances": [w for w in words if w.lower() in filler_words],
            "score": calculate_filler_word_score(filler_count, word_count)
        }
    }

def calculate_language_metrics(doc: spacy.tokens.Doc) -> dict:
    """Calculate language and clarity metrics"""
    # Vocabulary diversity
    unique_words = len(set([token.text.lower() for token in doc if token.is_alpha]))
    total_words = len([token for token in doc if token.is_alpha])
    vocab_diversity = (unique_words / total_words * 100) if total_words > 0 else 0
    
    # Grammar analysis using simple rules
    grammar_issues = []
    sentence_count = len(list(doc.sents))
    
    return {
        "vocabulary": {
            "diversity_score": round(vocab_diversity, 2),
            "unique_words": unique_words,
            "total_words": total_words,
            "score": calculate_vocabulary_score(vocab_diversity)
        },
        "clarity": {
            "readability_score": textstat.flesch_reading_ease(doc.text),
            "sentence_count": sentence_count,
            "avg_sentence_length": round(total_words / sentence_count if sentence_count > 0 else 0, 2),
            "score": calculate_clarity_score(doc.text)
        },
        "grammar": {
            "issues": grammar_issues,
            "score": calculate_grammar_score(doc)
        }
    }

# Add scoring helper functions
def calculate_pace_score(wpm: float) -> int:
    """Calculate score for speaking pace"""
    if 120 <= wpm <= 150:
        return 100
    elif 100 <= wpm < 120 or 150 < wpm <= 170:
        return 80
    elif 80 <= wpm < 100 or 170 < wpm <= 190:
        return 60
    else:
        return 40

def calculate_pause_score(pause_ratio: float) -> int:
    """Calculate score for pause usage"""
    optimal_ratio = 0.15  # 15% of speech should be pauses
    difference = abs(pause_ratio - optimal_ratio)
    return max(0, 100 - int(difference * 200))

def calculate_filler_word_score(filler_count: int, word_count: int) -> int:
    """Calculate score for filler word usage"""
    ratio = (filler_count / word_count * 100) if word_count > 0 else 0
    return max(0, 100 - int(ratio * 5))

def calculate_vocabulary_score(diversity: float) -> int:
    """Calculate score for vocabulary diversity"""
    if diversity >= 60:
        return 100
    elif diversity >= 45:
        return 80
    elif diversity >= 30:
        return 60
    else:
        return 40

def calculate_clarity_score(text: str) -> int:
    """Calculate score for speech clarity"""
    flesch_score = textstat.flesch_reading_ease(text)
    if flesch_score >= 80:
        return 100
    elif flesch_score >= 60:
        return 80
    elif flesch_score >= 40:
        return 60
    else:
        return 40

def calculate_grammar_score(doc: spacy.tokens.Doc) -> int:
    """Calculate score for grammar usage"""
    # Simplified grammar scoring - can be enhanced with more sophisticated rules
    return 80  # Placeholder score

@app.post("/full-analysis")
async def full_analysis(request: FullAnalysisRequest):
    """Generate comprehensive speech analysis with detailed metrics"""
    try:
        # Process the speech text with spaCy
        doc = nlp(request.speech_text)
        
        # Calculate metrics first
        speech_metrics = calculate_speech_metrics(request.speech_text, doc, 180)
        language_metrics = calculate_language_metrics(doc)

        # Create analysis prompt for Llama
        analysis_prompt = f"""
        Analyze this speaking performance with current metrics:

        Speech Text: {request.speech_text}

        Current Metrics:
        - Speaking Pace: {speech_metrics["speaking_pace"]["wpm"]} WPM
        - Filler Words: {speech_metrics["filler_words"]["count"]} instances
        - Clarity Score: {language_metrics["clarity"]["readability_score"]}
        - Vocabulary Score: {language_metrics["vocabulary"]["diversity_score"]}

        Rate each category from 0-100 and explain why:
        1. Speaking Pace (ideal is 120-150 words per minute)
        2. Filler Words Usage (um, uh, like, etc.)
        3. Clarity & Pronunciation
        4. Vocabulary Diversity
        5. Grammar Accuracy
        6. Pause Usage & Timing

        Format response exactly as:
        speaking_pace: [score]
        filler_words: [score]
        clarity: [score]
        vocabulary: [score]
        grammar: [score]
        pause_usage: [score]
        explanation: [brief analysis of each score]
        """

        # Get Llama analysis with timeout
        try:
            analysis_result = await asyncio.wait_for(
                asyncio.to_thread(analyzer.llm.analyze, analysis_prompt),
                timeout=30.0
            )
            print(f"Raw Llama analysis: {analysis_result}")  # Debug log
            
            # Parse scores with better error handling
            scores = {}
            lines = str(analysis_result).split('\n')
            for line in lines:
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip()
                    try:
                        if key in ['speaking_pace', 'filler_words', 'clarity', 'vocabulary', 'grammar', 'pause_usage']:
                            value = int(value.strip())
                            if 0 <= value <= 100:
                                scores[key] = value
                    except ValueError:
                        continue

        except Exception as e:
            print(f"Llama analysis failed: {e}")
            scores = {}

        # Transform metrics with dynamic values
        transformed_metrics = [
            {
                "label": "Speaking Pace",
                "value": scores.get('speaking_pace', speech_metrics["speaking_pace"]["score"]),
                "icon": "speedometer",
                "trend": "up" if speech_metrics["speaking_pace"]["wpm"] >= 120 else "down",
                "change": abs(speech_metrics["speaking_pace"]["wpm"] - 135) / 135  # Deviation from ideal pace
            },
            {
                "label": "Clarity",
                "value": scores.get('clarity', language_metrics["clarity"]["score"]),
                "icon": "mic",
                "trend": "up" if language_metrics["clarity"]["readability_score"] >= 60 else "down",
                "change": language_metrics["clarity"]["readability_score"] / 100
            },
            {
                "label": "Filler Words",
                "value": scores.get('filler_words', speech_metrics["filler_words"]["score"]),
                "icon": "warning",
                "trend": "down" if speech_metrics["filler_words"]["ratio"] < 5 else "up",
                "change": speech_metrics["filler_words"]["ratio"] / 100
            },
            {
                "label": "Vocabulary",
                "value": scores.get('vocabulary', language_metrics["vocabulary"]["score"]),
                "icon": "book",
                "trend": "up" if language_metrics["vocabulary"]["diversity_score"] >= 45 else "down",
                "change": language_metrics["vocabulary"]["diversity_score"] / 100
            }
        ]

        print(f"Transformed metrics: {transformed_metrics}")  # Debug log

        # Prepare analysis record
        analysis_record = {
            "student_id": request.student_id,
            "module_id": request.module_id,
            "attempt_id": request.attempt_id,
            "session_id": request.session_id,
            "speaking_pace": transformed_metrics[0]["value"],
            "filler_words_score": transformed_metrics[2]["value"],
            "clarity_score": transformed_metrics[1]["value"],
            "vocabulary_score": transformed_metrics[3]["value"],
            "grammar_score": scores.get('grammar', 70),
            "pause_score": scores.get('pause_usage', speech_metrics["pauses"]["score"]),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        # Check if record exists for this module_id
        existing = supabase.table("full_analysis_scores")\
            .select("*")\
            .eq("module_id", request.module_id)\
            .execute()

        if existing.data and len(existing.data) > 0:
            # Update existing record
            print(f"Updating analysis for module_id: {request.module_id}")
            response = supabase.table("full_analysis_scores")\
                .update(analysis_record)\
                .eq("module_id", request.module_id)\
                .execute()
        else:
            # Insert new record
            print(f"Creating new analysis for module_id: {request.module_id}")
            response = supabase.table("full_analysis_statistics")\
                .insert(analysis_record)\
                .execute()

        # Return response with analysis results
        return {
            "success": True,
            "metrics": transformed_metrics,
            "analysis": {
                "speech_delivery": speech_metrics,
                "language_clarity": language_metrics
            },
            "improvement_suggestions": generate_improvement_suggestions(speech_metrics, language_metrics),
            "operation": "updated" if existing.data else "created"
        }

    except Exception as e:
        print(f"Error in full analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_improvement_suggestions(speech_metrics: dict, language_metrics: dict) -> list:
    """Generate specific improvement suggestions based on metrics"""
    suggestions = []
    
    # Speaking pace suggestions
    wpm = speech_metrics["speaking_pace"]["wpm"]
    if wpm < 120:
        suggestions.append({
            "category": "Speaking Pace",
            "suggestion": "Try to speak a bit faster while maintaining clarity."
        })
    elif wpm > 150:
        suggestions.append({
            "category": "Speaking Pace",
            "suggestion": "Slow down slightly to improve understanding."
        })
    
    # Filler words suggestions
    if speech_metrics["filler_words"]["ratio"] > 5:
        suggestions.append({
            "category": "Filler Words",
            "suggestion": f"Work on reducing filler words like: {', '.join(speech_metrics['filler_words']['instances'][:3])}"
        })
    
    # Vocabulary suggestions
    if language_metrics["vocabulary"]["diversity_score"] < 45:
        suggestions.append({
            "category": "Vocabulary",
            "suggestion": "Try to use more varied vocabulary to enhance expression."
        })
    
    # Clarity suggestions
    if language_metrics["clarity"]["readability_score"] < 60:
        suggestions.append({
            "category": "Clarity",
            "suggestion": "Use simpler sentences to improve clarity."
        })
    
    return suggestions