# BPMN Generator Setup Guide

This guide will help you set up and run the BPMN Generator project, which converts natural language business process descriptions into BPMN diagrams using OpenAI and BPMN-js. The project is fully Dockerized for easy deployment and development.

---

## Folder & File Structure

```
bpmn-generator/
├── .env                # Root environment file (OpenAI API key)
├── docker-compose.yml  # Docker Compose config for frontend & backend
├── Read_me.md          # This setup guide
├── backend/
│   ├── .env            # Backend environment file (OpenAI API key)
│   ├── Dockerfile      # Backend Dockerfile
│   ├── requirements.txt# Python dependencies
│   ├── app/
│   │   ├── __init__.py # Python package initializer
│   │   ├── main.py     # FastAPI app (API endpoints)
│   │   ├── models.py   # Pydantic models
│   │   ├── services.py # BPMN generation/validation logic
│   │   └── __pycache__ # Python bytecode cache
├── frontend/
│   ├── .dockerignore   # Files/folders to ignore in Docker build
│   ├── .env            # Frontend environment file (API URL)
│   ├── Dockerfile      # Frontend Dockerfile
│   ├── nginx.conf      # Nginx config (optional for production)
│   ├── package.json    # Frontend dependencies/scripts
│   ├── public/
│   │   ├── favicon.ico # Favicon
│   │   └── index.html  # HTML template
│   ├── src/
│   │   ├── App.js      # Main React app
│   │   ├── index.js    # React entry point
│   │   └── components/
│   │       └── BpmnViewer.js # BPMN diagram renderer
```

---

## Step-by-Step Construction Guide

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd bpmn-generator
```

### 2. Add Your OpenAI API Key

Create a `.env` file in both the root and `backend/` folders:

```
OPENAI_API_KEY=your_actual_openai_api_key_here
```

### 3. Backend Setup

- **backend/Dockerfile**: Defines Python 3.10 slim image, installs dependencies, copies app code, exposes port 8000, runs FastAPI with Uvicorn.
- **backend/requirements.txt**: Lists all required Python packages (FastAPI, Uvicorn, OpenAI, Pydantic, etc).
- **backend/app/main.py**: Implements FastAPI endpoints `/generate-bpmn`, `/health`, and `/`.
- **backend/app/services.py**: Contains logic for generating BPMN XML, validating BPMN, and explaining the process.
- **backend/app/models.py**: Defines Pydantic models for request/response data.
- **backend/app/__init__.py**: Marks the app folder as a Python package.
- **backend/.env**: Stores the OpenAI API key for backend container.

### 4. Frontend Setup

- **frontend/Dockerfile**: Uses Node 16 Alpine, installs dependencies, copies source, exposes port 3000, runs React app.
- **frontend/package.json**: Specifies React, axios, bpmn-js, styled-components, and scripts for start/build/test.
- **frontend/.env**: Sets the API URL for React (`REACT_APP_API_URL=http://localhost:8000`).
- **frontend/.dockerignore**: Excludes node_modules, build, git files, etc from Docker build context.
- **frontend/public/index.html**: Main HTML template for React app.
- **frontend/public/favicon.ico**: Favicon for the app.
- **frontend/src/App.js**: Main React component, handles user input, calls backend API, displays BPMN diagram and explanation.
- **frontend/src/index.js**: Entry point for React app, renders `App` into the DOM.
- **frontend/src/components/BpmnViewer.js**: Uses `bpmn-js` to render BPMN XML in the browser.
- **frontend/nginx.conf**: (Optional) Nginx config for serving built React app and proxying API requests in production.

### 5. Docker Compose Setup

- **docker-compose.yml**: Orchestrates backend and frontend containers, sets up environment variables, mounts volumes for hot-reloading, exposes ports 8000 (backend) and 3000 (frontend).

### 6. Build and Run the Application

#### Production Mode (Dockerized)

```bash
docker-compose up --build
```
- Access the frontend at: http://localhost:3000
- Access the backend API at: http://localhost:8000

To stop:
```bash
docker-compose down
```

#### Development Mode (Hot Reload)

- **Backend (Docker):**
  ```bash
  cd backend
  docker build -t bpmn-backend .
  docker run -p 8000:8000 --env-file ../.env bpmn-backend
  ```
- **Frontend (Local):**
  ```bash
  cd frontend
  npm install
  npm start
  ```

---

## Troubleshooting

- Ensure your OpenAI API key is valid and present in `.env` files
- If you change dependencies, rebuild containers: `docker-compose up --build`
- For frontend issues, check browser console and terminal logs
- For backend issues, check container logs: `docker logs <container_id>`

---

## License

MIT
