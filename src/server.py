from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the absolute path to the project root
project_root = Path(__file__).parent.parent.absolute()
sys.path.append(str(project_root))

from python.categorizer import handle_categorization

app = Flask(__name__)
CORS(app, resources={
    r"/categorize": {
        "origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174"
        ],
        "methods": ["POST"],
        "allow_headers": ["Content-Type", "Accept"],
        "max_age": 3600
    }
})

@app.route('/categorize', methods=['POST'])
def categorize():
    try:
        data = request.get_json()
        if not data:
            logger.error("No JSON data received")
            return jsonify({'error': 'No JSON data received'}), 400
            
        account_name = data.get('account_name')
        categories_data = data.get('categories')
        
        if not account_name or not categories_data:
            logger.error("Missing required data")
            return jsonify({'error': 'Missing required data'}), 400
        
        logger.info(f"Processing categorization request for account: {account_name}")
        result = handle_categorization(account_name, categories_data)
        return result, 200, {'Content-Type': 'application/json'}
        
    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Flask server on port 5000...")
    try:
        app.run(host='127.0.0.1', port=5000, debug=True)
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        sys.exit(1)