#!/bin/bash
# Render build script for backend with Playwright support

set -e

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Installing Playwright browsers and system dependencies..."
pip install playwright==1.55.0
playwright install --with-deps chromium

echo "Build complete!"
