from transformers import pipeline
import json
import logging
import torch

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

device = 0 if torch.cuda.is_available() else -1  # 0 = first GPU, -1 = CPU fallback

classifier = pipeline(
    "zero-shot-classification",
    model="MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli",
    # 1. More precise logic and fine-tuning across multiple NLI datasets
    # "MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli"

    # 2. Strong multilingual + financial reasoning
    # "joeddav/xlm-roberta-large-xnli"

    # 3. Lightweight and very fast (less accurate)
    # "valhalla/distilbart-mnli-12-1"

    # 4. Generic fallback for older systems
    # "facebook/bart-large-mnli"

    device=device
)



def categorize_account(account_name, categories_data):
    try:
        categories = load_categories(categories_data)

        # Try fast classification for accountType and primary
        account_type, primary = get_default_classification(account_name)

        # If fast path worked, only LLM classify secondary and tertiary
        if account_type != 'Uncategorized':
            secondary_labels = list(categories.get(account_type, {}).get(primary, {}).keys())
            secondary = "Uncategorized"
            tertiary = "Uncategorized"

            if secondary_labels:
                step3_input = f"{account_name} | Type: {account_type} | Primary: {primary}"
                step3 = classifier(step3_input, candidate_labels=secondary_labels)
                secondary = step3["labels"][0]

                tertiary_labels = categories[account_type][primary][secondary]
                if tertiary_labels:
                    step4_input = f"{account_name} | Type: {account_type} | Primary: {primary} | Secondary: {secondary}"
                    step4 = classifier(step4_input, candidate_labels=tertiary_labels)
                    tertiary = step4["labels"][0]

            return {
                "accountType": account_type,
                "primary": primary,
                "secondary": secondary,
                "tertiary": tertiary
            }

        # If no match, proceed with full LLM classification
        # Step 1: Account Type
        account_type_labels = list(categories.keys())
        step1 = classifier(account_name, candidate_labels=account_type_labels)
        account_type = step1["labels"][0]

        # Step 2: Primary Category
        primary_labels = list(categories[account_type].keys())
        step2_input = f"{account_name} | Type: {account_type}"
        step2 = classifier(step2_input, candidate_labels=primary_labels)
        primary = step2["labels"][0]

        # Step 3: Secondary Category
        secondary_labels = list(categories[account_type][primary].keys())
        step3_input = f"{account_name} | Type: {account_type} | Primary: {primary}"
        step3 = classifier(step3_input, candidate_labels=secondary_labels)
        secondary = step3["labels"][0]

        # Step 4: Tertiary Category
        tertiary_labels = categories[account_type][primary][secondary]
        step4_input = f"{account_name} | Type: {account_type} | Primary: {primary} | Secondary: {secondary}"
        step4 = classifier(step4_input, candidate_labels=tertiary_labels)
        tertiary = step4["labels"][0]

        return {
            "accountType": account_type,
            "primary": primary,
            "secondary": secondary,
            "tertiary": tertiary
        }

    except Exception as e:
        logging.error(f"❌ Error categorizing '{account_name}': {str(e)}")
        return {
            "accountType": "Uncategorized",
            "primary": "Uncategorized",
            "secondary": "Uncategorized",
            "tertiary": "Uncategorized"
        }


        logger.info(f"✅ Hierarchical categorization result: {result}")
        return result

    except Exception as e:
        logger.error(f"❌ Error during categorization: {str(e)}")
        return {
            "accountType": "Uncategorized",
            "primary": "Uncategorized",
            "secondary": "Uncategorized",
            "tertiary": "Uncategorized"
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
