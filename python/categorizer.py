from transformers import pipeline
import json

def load_categories(categories_data):
    """Convert categories data into a structured format for matching"""
    structured_categories = {}
    for cat in categories_data:
        account_type = cat['accountType']
        primary = cat['primary']
        secondary = cat['secondary']
        tertiary = cat['tertiary']
        
        if account_type not in structured_categories:
            structured_categories[account_type] = {}
        if primary not in structured_categories[account_type]:
            structured_categories[account_type][primary] = {}
        if secondary not in structured_categories[account_type][primary]:
            structured_categories[account_type][primary][secondary] = []
        if tertiary not in structured_categories[account_type][primary][secondary]:
            structured_categories[account_type][primary][secondary].append(tertiary)
    
    return structured_categories

def create_prompt(account_name, categories):
    """Create a prompt for the LLM to categorize the account"""
    prompt = f"""Given the account name '{account_name}', categorize it into the most appropriate accounting classification.
Available categories are:

Account Types: {', '.join(categories.keys())}

For each account type, here are the primary classifications:
"""
    
    for acc_type, primaries in categories.items():
        prompt += f"\n{acc_type}: {', '.join(primaries.keys())}"
    
    prompt += "\n\nRespond ONLY with the account type and primary classification separated by '|' (e.g., 'Asset|Current Assets')"
    
    return prompt

def categorize_account(account_name, categories_data):
    """Use LLM to categorize an account based on its name"""
    try:
        # Initialize the LLM pipeline
        classifier = pipeline("text-generation", model="gpt2")
        
        # Load and structure categories
        categories = load_categories(categories_data)
        
        # Create the prompt
        prompt = create_prompt(account_name, categories)
        
        # Get LLM prediction
        result = classifier(prompt, max_length=50, num_return_sequences=1)[0]['generated_text']
        
        # Extract the prediction (last line containing the '|')
        prediction = [line for line in result.split('\n') if '|' in line][-1].strip()
        account_type, primary = prediction.split('|')
        
        # Find the most appropriate secondary and tertiary classifications
        secondary = next(iter(categories[account_type][primary].keys()))
        tertiary = categories[account_type][primary][secondary][0]
        
        return {
            'accountType': account_type,
            'primary': primary,
            'secondary': secondary,
            'tertiary': tertiary
        }
    except Exception as e:
        print(f"Error categorizing account '{account_name}': {str(e)}")
        return {
            'accountType': 'Uncategorized',
            'primary': 'Uncategorized',
            'secondary': 'Uncategorized',
            'tertiary': 'Uncategorized'
        }

# API endpoint handler
def handle_categorization(account_name, categories_data):
    """Handle categorization requests from the frontend"""
    result = categorize_account(account_name, categories_data)
    return json.dumps(result)