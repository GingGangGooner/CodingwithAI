# start-backend.ps1

# Activate virtual environment
. .\.venv\Scripts\Activate.ps1

# Install requirements (optional but safe)
pip install -r requirements.txt

# Run Flask server
python src/server.py
