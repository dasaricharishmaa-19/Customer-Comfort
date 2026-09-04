from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Customer Comfort AI",
    description="AI-powered customer emotion analysis and comfort assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EmotionRequest(BaseModel):
    text: str


@app.get("/")
def home():
    return {
        "message": "Customer Comfort AI backend is running!",
        "status": "success"
    }


@app.post("/analyze")
def analyze_emotion(request: EmotionRequest):

    user_text = request.text.strip()

    if not user_text:
        raise HTTPException(
            status_code=400,
            detail="Please provide some text."
        )

    api_key = os.getenv("FEATHERLESS_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="FEATHERLESS_API_KEY is missing in .env file."
        )

    url = "https://api.featherless.ai/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "messages": [
            {
                "role": "system",
                "content": """
You are Customer Comfort AI.

Analyze the customer's message.

Identify:
1. Primary emotion
2. Intensity from 1 to 10
3. Customer mood
4. Whether the customer is frustrated
5. Whether urgent attention is needed
6. Short reason
7. A polite customer-service response

Return ONLY this format:

Emotion: <emotion>
Intensity: <number>/10
Mood: <mood>
Frustrated: <Yes/No>
Urgent: <Yes/No>
Reason: <short reason>
Recommended Response: <response>
"""
            },
            {
                "role": "user",
                "content": user_text
            }
        ],
        "temperature": 0.3,
        "max_tokens": 300
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=60
        )

        # Show the REAL Featherless error
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Featherless API Error: {response.text}"
            )

        result = response.json()

        if "choices" not in result:
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected Featherless response: {result}"
            )

        ai_response = result["choices"][0]["message"]["content"]

        return {
            "success": True,
            "input": user_text,
            "analysis": ai_response
        }

    except HTTPException:
        # IMPORTANT: Don't convert Featherless errors into 500
        raise

    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="Featherless API request timed out."
        )

    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"API connection error: {str(e)}"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )