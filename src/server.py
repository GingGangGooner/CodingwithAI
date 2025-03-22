from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from pathlib import Path

# Get the absolute path to the project root
project_root = Path(__file__).parent.parent.absolute()
sys.path.append(str(project_root))

from python.categorizer import handle_categorization

app = Flask(__name__)
CORS(app, resources={
    r"/categorize": {
        "origins": ["http://localhost:5173"],
        "methods": ["POST"],
        "allow_headers": ["Content-Type"]
    }
})

@app.route('/categorize', methods=['POST'])
def categorize():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        account_name = data.get('account_name')
        categories_data = data.get('categories')
        
        if not account_name or not categories_data:
            return jsonify({'error': 'Missing required data'}), 400
        
        result = handle_categorization(account_name, categories_data)
        return result, 200
        
    except Exception as e:
        print(f"Server error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)