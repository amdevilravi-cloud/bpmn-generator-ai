from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
from services import generate_bpmn, validate_bpmn, explain_process

# Use environment variable with fallback
api_url = os.environ.get("LMSTUDIO_API_URL", "http://localhost:1234/v1/chat/completions")
app = FastAPI(title="BPMN Generator API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class ProcessDescription(BaseModel):
    text: str

@app.post("/generate-bpmn")
async def generate_bpmn_from_text(description: ProcessDescription):
    try:
        # Step 1: Use local API to extract process information
        prompt = f"""
        Extract the business process elements from the following description and return them in a structured JSON format
        
        Identify tasks, actors, decisions, events, and sequences.

        Description: {description.text}

        Return JSON with this structure:
        {{
          "process_name": "name",
          "tasks": [{{"name": "task1", "actor": "role"}}],
          "decisions": [{{"condition": "condition description", "yes": "next step", "no": "alternative step"}}],
          "events": ["start", "end", "other events"],
          "sequence": ["task1", "decision1", "task2"]
        }}
        """

        payload = {
           
           "model": "lmstudio-coder-3b",  # adjust based on your actual model
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            
        }
        response = requests.post(api_url, json=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Local API error: {response.text}")
        result = response.json()
        process_data = result["choices"][0]["message"]["content"]

        # Extract JSON from the response (it might have text around it)
        import re
        json_match = re.search(r'\{.*\}', process_data, re.DOTALL)
        if json_match:
            process_json = json_match.group()
            import json
            process_info = json.loads(process_json)
        else:
            raise HTTPException(status_code=500, detail="Failed to parse process information")

        # Step 2: Generate BPMN XML
        bpmn_xml = generate_bpmn(process_info)

        # Step 3: Validate the BPMN
        validation_result = validate_bpmn(bpmn_xml)

        # Step 4: Generate explanation
        explanation = explain_process(process_info)

        return {
            "bpmn_xml": bpmn_xml,
            "validation": validation_result,
            "explanation": explanation,
            "process_info": process_info
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {"message": "BPMN Generator API is running. Use /generate-bpmn endpoint."}