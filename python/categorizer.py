from transformers import pipeline
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    prompt = f"Account: {account_name}\nCategories:\n"
    
    for acc_type, primaries in categories.items():
        prompt += f"{acc_type}: {', '.join(primaries.keys())}\n"
    
    prompt += "\nFormat: Type|Primary"
    return prompt

def get_default_classification(account_name):
    """Get default classification based on account name keywords"""
    account_lower = account_name.lower()
    
    if any(keyword in account_lower for keyword in ['cash', 'bank', 'paypal']):
        return 'Asset', 'Cash and Cash Equivalents'
    
    if any(keyword in account_lower for keyword in ['income']):
        return 'Revenue/income', 'Other Income'
    
    if any(keyword in account_lower for keyword in ['expense', 'training', 'rent', 'fees', 'charges']):
        return 'Cost/Expense', 'Operational Expenses'
    
    return 'Uncategorized', 'Uncategorized'

def categorize_account(account_name, categories_data):
    try:
        # Check default classification first
        primary, secondary = get_default_classification(account_name)
        tertiary = 'Uncategorized'  # Default tertiary category if no other classification

        # If default classification is found, skip LLM classification
        if primary != 'Uncategorized':
            logger.info(f"Using default classification: {primary} | {secondary} | {tertiary}")
            return {
                'accountType': primary,
                'primary': primary,
                'secondary': secondary,
                'tertiary': tertiary
            }

        # If no default classification, continue with LLM classification
        classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
        
        # Load and structure categories
        categories = load_categories(categories_data)
        
        # Create the prompt
        prompt = create_prompt(account_name, categories)
        
        logger.info(f"\n🧾 Prompt:\n{prompt}\n")

        candidate_labels = ['Revenue/income', 'Cost/Expense', 'Asset', 'Liability', 'Equity']
        result = classifier(prompt, candidate_labels=candidate_labels)
        logger.info(f"🧠 Model output:\n{result}\n")

        # Get the primary label from the result
        account_type = result['labels'][0]  # This is the label the LLM assigned for categorization

        # Default classifications for secondary and tertiary if no valid categories are found
        secondary, tertiary = 'Uncategorized', 'Uncategorized'

        # Check structured categories to assign secondary and tertiary classifications
        if account_type in categories:
            for primary_category, secondary_categories in categories[account_type].items():
                if primary_category == account_type:  # LLM assigns the category based on account_type
                    primary = primary_category  # Primary category determined by the LLM
                    secondary = next(iter(secondary_categories.keys()), 'Uncategorized')  # First secondary category
                    tertiary = next(iter(secondary_categories[secondary]), 'Uncategorized')  # First tertiary category

        output = {
            'accountType': account_type,
            'primary': primary,
            'secondary': secondary,
            'tertiary': tertiary
        }

        logger.info(f"✅ Categorization result: {output}\n")
        return output

    except Exception as e:
        logger.error(f"❌ Error categorizing account '{account_name}': {str(e)}")
        return {
            'accountType': 'Uncategorized',
            'primary': 'Uncategorized',
            'secondary': 'Uncategorized',
            'tertiary': 'Uncategorized'
        }

def handle_categorization(account_name, categories_data):
    """Handle categorization requests from the frontend"""
    result = categorize_account(account_name, categories_data)
    return json.dumps(result)
