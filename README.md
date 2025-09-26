# BPMN Generator AI

A FastAPI-based backend service that generates BPMN diagrams from business process descriptions using a local LLM API (e.g., LM Studio). The service parses natural language, extracts process elements, and returns BPMN XML, validation, and explanation.

---

## Project Structure

```
bpmn-generator-ai/
│
├── app/                  # (empty, legacy folder)
│
├── main.py               # FastAPI application entrypoint
├── models.py             # (optional) Data models (not used in main flow)
├── services.py           # BPMN generation, validation, and explanation logic
├── requirements.txt      # Python dependencies
├── Dockerfile            # Container build instructions
├── render.yaml           # Render.com deployment config
├── .env                  # Environment variables
├── README.md             # Project documentation
├── __init__.py           # (empty, for package structure)
├── myenv/                # Python virtual environment (local only)
└── app/
    └── __pycache__/      # Python bytecode cache
```

---

## Main Components

- **main.py**: FastAPI app, exposes `/generate-bpmn` endpoint. Handles CORS, request parsing, and calls LLM API.
- **services.py**: Contains `generate_bpmn`, `validate_bpmn`, and `explain_process` functions. Converts structured process info to BPMN XML.
- **requirements.txt**: Includes FastAPI, Uvicorn, Gunicorn, requests, bpmn-python, and other dependencies.
- **Dockerfile**: Production-ready, uses Gunicorn for serving FastAPI.
- **render.yaml**: Configuration for deploying to Render.com.
- **.env**: Stores environment variables (e.g., API keys, LLM endpoint).

---

## BPMN Generation Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant FastAPI
    participant LLM_API
    participant Services

    User->>Frontend: Enter process description
    Frontend->>FastAPI: POST /generate-bpmn {text}
    FastAPI->>LLM_API: POST /v1/chat/completions (prompt)
    LLM_API-->>FastAPI: JSON with process elements
    FastAPI->>Services: generate_bpmn(process_info)
    Services-->>FastAPI: BPMN XML
    FastAPI->>Services: validate_bpmn(bpmn_xml)
    Services-->>FastAPI: Validation result
    FastAPI->>Services: explain_process(process_info)
    Services-->>FastAPI: Explanation
    FastAPI-->>Frontend: {bpmn_xml, validation, explanation, process_info}
    Frontend-->>User: Display BPMN diagram and explanation
```

---

## How It Works

1. **User** submits a business process description.
2. **FastAPI** receives the request and sends a prompt to the local LLM API (e.g., LM Studio).
3. **LLM API** returns structured JSON with process elements (tasks, decisions, events, sequence).
4. **FastAPI** calls `generate_bpmn` in `services.py` to create BPMN XML.
5. **FastAPI** validates the BPMN XML and generates a human-readable explanation.
6. **Response** includes BPMN XML, validation status, explanation, and parsed process info.

---

## Deployment

- **Local**: Run with Uvicorn for development.
- **Production**: Use Docker and Gunicorn. Deploy to Render.com using `render.yaml`.

---

## Environment Variables

- `LMSTUDIO_API_URL`: URL for the local LLM API (default: `http://localhost:1234/v1/chat/completions`)
- `OPENAI_API_KEY`: (legacy, not used in current flow)

---

## Extending

- Add a frontend to visualize BPMN XML (e.g., bpmn-js).
- Integrate with other LLMs or BPMN libraries.
- Add authentication or user management.

---

## License

MIT
