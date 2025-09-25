FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ALL application code to /app
COPY . .

EXPOSE 8000

# Fix the command - main.py should be in root
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]