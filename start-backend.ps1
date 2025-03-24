Write-Host "Starting backend..."

# Check if .venv exists, if not, create it
if (-Not (Test-Path ".\.venv")) {
    Write-Host "Creating Python virtual environment..."
    python -m venv .venv
}

# Activate the virtual environment
. .\.venv\Scripts\Activate.ps1

# Install dependencies inside the virtual environment
pip install -r requirements.txt

# Start the Flask backend
python ./src/server.py
