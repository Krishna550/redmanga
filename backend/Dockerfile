# Use official Python runtime as base image
FROM python:3.11-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies as root (required by Playwright)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt /app/requirements.txt

# Install Python dependencies as root
RUN pip install --no-cache-dir -r /app/requirements.txt

# Install Playwright system dependencies as root
# This installs all the libraries needed by Chromium
RUN playwright install-deps chromium

# Copy backend source
COPY . /app/

# Create a non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Now install Playwright browsers as appuser (without --with-deps)
# The system deps are already installed from previous step
RUN playwright install chromium

# Expose and run on $PORT (Render sets PORT at runtime)
EXPOSE 8000
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]
