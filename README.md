# Accounting Report Standardizer

A web application for standardizing and categorizing accounting reports with AI-powered classification.

## Prerequisites

- Python 3.13
- Node.js (Latest LTS version recommended)
- Python virtual environment

## Setup Instructions

1. **Python Virtual Environment Setup**
   ```bash
   # Create and activate virtual environment
   python -m venv .venv
   
   # On Windows
   .venv\Scripts\activate
   
   # On macOS/Linux
   source .venv/bin/activate
   
   # Install Python dependencies
   pip install flask flask-cors transformers torch
   ```

2. **Node.js Dependencies**
   ```bash
   # Install Node.js dependencies
   npm install --legacy-peer-deps
   npm install lucide-react
   npm install concurrently --legacy-peer-deps
   ```

3. **Running the Application**
   ```bash
   # Start both frontend and backend servers
   npm run dev
   ```

## Important Notes

- The backend requires the Python virtual environment (`.venv`) to be activated
- Both frontend and backend servers will start concurrently
- Frontend runs on port 5173
- Backend runs on port 5000

## Features

- AI-powered account categorization
- Excel file processing
- Interactive category management
- Export functionality
- Real-time totals calculation

## Technology Stack

- Frontend: React + TypeScript + Vite
- Backend: Flask + Python
- ML: Transformers
- Styling: Tailwind CSS
