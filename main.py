from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import re
import json
from services import generate_bpmn, validate_bpmn, explain_process
from bedrock_service import bedrock_service

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

def create_process_prompt(text):
    """Create optimized prompt for Claude Haiku"""
    return f"""You are a business process analysis expert. Extract business process elements from the following description and return ONLY valid JSON.

DESCRIPTION:
{text}

Return JSON with this exact structure:
{{
  "process_name": "concise process name",
  "tasks": [
    {{"name": "task description", "actor": "role or system"}}
  ],
  "decisions": [
    {{"condition": "decision condition", "yes": "path if true", "no": "path if false"}}
  ],
  "events": ["start", "end"],
  "sequence": ["start", "task1", "decision1", "task2", "end"]
}}

Guidelines:
- Extract 3-8 main tasks maximum
- Identify clear decision points with if/then logic
- Keep task names concise but descriptive
- Use generic actors like "System", "User", "Manager" when not specified
- Ensure JSON is valid and properly formatted

Return ONLY the JSON object, no other text."""

def parse_claude_response(response_text):
    """Parse Claude's response and extract JSON"""
    try:
        # Try to find JSON in the response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            return json.loads(json_str)
        else:
            # If no JSON found, try to parse the entire response
            return json.loads(response_text)
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Raw response: {response_text}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response as JSON")

def fallback_process_extraction(text):
    """Fallback method if Bedrock fails"""
    sentences = re.split(r'[.!?]+', text)
    tasks = []
    decisions = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
            
        # Simple task extraction
        if any(verb in sentence.lower() for verb in ['check', 'process', 'validate', 'approve', 'send', 'create', 'update', 'verify']):
            tasks.append({"name": sentence[:80], "actor": "User"})
        
        # Decision extraction
        if 'if' in sentence.lower() or 'when' in sentence.lower():
            decisions.append({
                "condition": sentence[:100],
                "yes": "Continue process",
                "no": "Take alternative action"
            })
    
    if not tasks:
        tasks.append({"name": "Main Process Task", "actor": "User"})
    
    return {
        "process_name": text[:50] + " Process",
        "tasks": tasks[:6],  # Limit tasks
        "decisions": decisions[:3],  # Limit decisions
        "events": ["start", "end"],
        "sequence": ["start"] + [f"task_{i+1}" for i in range(len(tasks))] + ["end"]
    }

@app.post("/generate-bpmn")
async def generate_bpmn_from_text(description: ProcessDescription):
    try:
        process_info = None
        
        # Try Bedrock first
        try:
            prompt = create_process_prompt(description.text)
            claude_response = bedrock_service.invoke_claude_haiku(
                prompt, 
                max_tokens=1500, 
                temperature=0.3  # Lower temperature for more consistent JSON
            )
            process_info = parse_claude_response(claude_response)
        except Exception as ai_error:
            print(f"Bedrock AI failed, using fallback: {ai_error}")
            # Use fallback method if AI fails
            process_info = fallback_process_extraction(description.text)
        
        # Generate BPMN XML
        bpmn_xml = generate_bpmn(process_info)
        validation_result = validate_bpmn(bpmn_xml)
        explanation = explain_process(process_info)

        return {
            "bpmn_xml": bpmn_xml,
            "validation": validation_result,
            "explanation": explanation,
            "process_info": process_info,
            "ai_provider": "bedrock" if "claude_response" in locals() else "fallback"
        }

    except Exception as e:
        print(f"Error in generate-bpmn: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    # Test Bedrock connection
    try:
        # Simple test - don't actually call Bedrock to avoid costs
        # Just check if client initialized
        if bedrock_service.client:
            return {"status": "healthy", "bedrock": "available"}
        else:
            return {"status": "healthy", "bedrock": "not_configured"}
    except Exception as e:
        return {"status": "healthy", "bedrock": f"error: {str(e)}"}

@app.get("/")
async def root():
    return {"message": "BPMN Generator API with Amazon Bedrock"}

@app.get("/test-bedrock")
async def test_bedrock():
    """Test endpoint to verify Bedrock connectivity"""
    try:
        test_prompt = "Return only this JSON: {\"test\": \"success\"}"
        response = bedrock_service.invoke_claude_haiku(test_prompt, max_tokens=100)
        return {"status": "success", "response": response}
    except Exception as e:
        return {"status": "error", "message": str(e)}