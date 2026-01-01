"""
LLM Response Parser Module
Parses and normalizes LLM responses for the form builder
Includes JSON repair logic for handling truncated responses from large forms
"""

import json
import re
from typing import Dict, List, Any, Optional, Tuple


def repair_truncated_json(json_str: str) -> str:
    """
    Attempt to repair truncated JSON by adding missing closing brackets/braces
    
    This is needed when LLM output gets truncated for very large forms (50+ MCQs)
    
    Args:
        json_str: Potentially truncated JSON string
        
    Returns:
        Repaired JSON string (may still be invalid, but worth trying)
    """
    import logging
    logger = logging.getLogger("ai-form-builder")
    
    # Count opening and closing brackets
    open_braces = json_str.count('{')
    close_braces = json_str.count('}')
    open_brackets = json_str.count('[')
    close_brackets = json_str.count(']')
    
    # If balanced, return as-is
    if open_braces == close_braces and open_brackets == close_brackets:
        return json_str
    
    logger.warning(f"Detected unbalanced JSON: {{ {open_braces}/{close_braces}, [ {open_brackets}/{close_brackets}")
    
    # Try to repair by adding missing closing characters
    repaired = json_str.rstrip()
    
    # Remove trailing comma if present (common truncation artifact)
    if repaired.endswith(','):
        repaired = repaired[:-1]
    
    # Remove incomplete string (ending with unclosed quote)
    # Look for patterns like: "label": "Some incomplete text
    if repaired.count('"') % 2 != 0:
        # Find last complete quote pair
        last_complete = repaired.rfind('",')
        if last_complete > 0:
            repaired = repaired[:last_complete + 2]
        else:
            # Try to close the string
            repaired += '"'
    
    # Add missing brackets (in reverse order - innermost first)
    missing_brackets = close_brackets - open_brackets
    missing_braces = close_braces - open_braces
    
    # Add missing closing brackets first
    for _ in range(abs(missing_brackets)):
        if missing_brackets < 0:
            repaired += ']'
    
    # Add missing closing braces
    for _ in range(abs(missing_braces)):
        if missing_braces < 0:
            repaired += '}'
    
    logger.info(f"Attempted JSON repair: added {abs(missing_brackets)} ] and {abs(missing_braces)} }}")
    
    return repaired


def parse_llm_response(response_text: str) -> Dict[str, Any]:
    """
    Parse LLM response for single-question mode
    
    Args:
        response_text: Raw text response from LLM
        
    Returns:
        Parsed response with mode and content
    """
    import logging
    logger = logging.getLogger("ai-form-builder")
    
    original_response = response_text  # Keep original for error reporting
    
    # Try to extract JSON from markdown code blocks
    if "```json" in response_text or "```" in response_text:
        # Extract JSON from code block
        import re
        json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(1).strip()
            logger.info("Extracted JSON from markdown code block")
    
    # Try to parse as JSON first
    try:    
        parsed = json.loads(response_text)
        
        if parsed.get("mode") == "question":
            # Validate single question
            question = parsed.get("question")
            if not question:
                raise ValueError("Missing question in response")
            
            # Validate question structure
            required = ["id", "label", "type"]
            for field in required:
                if field not in question:
                    raise ValueError(f"Missing {field} in question")
            
            # Validate options for radio/checkbox
            if question["type"] in ["radio", "checkbox"]:
                if not question.get("options"):
                    raise ValueError(f"{question['type']} must have options")
                if not isinstance(question["options"], list) or len(question["options"]) == 0:
                    raise ValueError(f"{question['type']} must have non-empty options list")
            
            return parsed
            
        elif parsed.get("mode") == "form_schema":
            # Validate form schema
            if not parsed.get("form"):
                raise ValueError("Missing form in response")
            return parsed
            
        else:
            # Fallback to old mode names for backward compatibility
            if "mode" in parsed:
                if parsed["mode"] == "questions":
                    parsed["mode"] = "question"
                elif parsed["mode"] == "final_form":
                    parsed["mode"] = "form_schema"
            return parsed
            
    except json.JSONDecodeError as e:
        logger.warning(f"Initial JSON decode failed: {str(e)}")
        logger.warning(f"Response text (first 500 chars): {response_text[:500]}")
        
        # Try to repair truncated JSON (common with large forms)
        repaired_json = repair_truncated_json(response_text)
        
        try:
            parsed = json.loads(repaired_json)
            logger.info("✅ JSON repair successful!")
            
            # Validate repaired response
            if parsed.get("mode") == "form_schema":
                if parsed.get("form"):
                    logger.info(f"Repaired form has {len(parsed['form'].get('fields', []))} fields")
                    return parsed
            elif parsed.get("mode") == "question":
                if parsed.get("question"):
                    return parsed
            
            # If we got here, structure is valid enough
            return parsed
            
        except json.JSONDecodeError as repair_error:
            logger.error(f"JSON repair also failed: {str(repair_error)}")
            
            # Fallback: try to detect mode from content
            if is_final_form(response_text):
                form_schema = extract_form_schema(response_text)
                if form_schema and form_schema.get("fields"):
                    logger.info(f"Extracted form schema with {len(form_schema.get('fields', []))} fields")
                    return {
                        "mode": "form_schema",
                        "form": form_schema
                    }
            
            # Return error mode with helpful message
            return {
                "mode": "error",
                "error": f"Failed to parse LLM response. The form may be too large. Try requesting fewer questions (e.g., 30 instead of 50). Error: {str(e)}"
            }


def extract_questions(response_text: str) -> List[Dict[str, Any]]:
    """
    Extract questions from LLM response and normalize to checkbox format
    
    Args:
        response_text: LLM response text
        
    Returns:
        List of normalized question objects
    """
    questions = []
    
    # Try to find JSON array of questions
    try:
        # Look for questions array in JSON
        json_match = re.search(r'"questions"\s*:\s*\[(.*?)\]', response_text, re.DOTALL)
        if json_match:
            questions_json = f'[{json_match.group(1)}]'
            questions = json.loads(questions_json)
            return questions
    except:
        pass
    
    # Fallback: Extract questions from numbered list or bullet points
    lines = response_text.split('\n')
    question_patterns = [
        r'^\d+\.\s*(.+\?)',  # 1. Question?
        r'^-\s*(.+\?)',       # - Question?
        r'^•\s*(.+\?)',       # • Question?
        r'^[*]\s*(.+\?)',     # * Question?
    ]
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        for pattern in question_patterns:
            match = re.match(pattern, line)
            if match:
                question_text = match.group(1).strip()
                # Generate ID from question text
                question_id = generate_question_id(question_text)
                questions.append({
                    "id": question_id,
                    "label": question_text,
                    "default": False
                })
                break
    
    return questions


def generate_question_id(question_text: str) -> str:
    """
    Generate a unique ID from question text
    
    Args:
        question_text: The question text
        
    Returns:
        snake_case ID
    """
    # Remove question mark and special characters
    text = question_text.lower().replace('?', '').strip()
    # Replace spaces with underscores
    text = re.sub(r'\s+', '_', text)
    # Remove non-alphanumeric characters except underscores
    text = re.sub(r'[^a-z0-9_]', '', text)
    # Limit length
    return text[:50]


def extract_form_schema(response_text: str) -> Dict[str, Any]:
    """
    Extract form schema from LLM response
    Enhanced to handle truncated JSON from large forms
    
    Args:
        response_text: LLM response containing form specification
        
    Returns:
        Form schema dictionary
    """
    import logging
    logger = logging.getLogger("ai-form-builder")
    
    # Try to parse JSON form schema
    try:
        # Look for form object in JSON
        json_match = re.search(r'"form"\s*:\s*({.*?})\s*}', response_text, re.DOTALL)
        if json_match:
            form_json = json_match.group(1) + '}'
            return json.loads(form_json)
    except:
        pass
    
    # Try to parse the entire response as JSON
    try:
        parsed = json.loads(response_text)
        if isinstance(parsed, dict):
            if "form" in parsed:
                return parsed["form"]
            elif "title" in parsed and "fields" in parsed:
                return parsed
    except:
        pass
    
    # NEW: Try to extract partial form data from truncated JSON
    logger.info("Attempting to extract partial form data from truncated JSON...")
    
    # Extract title
    title = "Generated Form"
    title_match = re.search(r'"title"\s*:\s*"([^"]+)"', response_text)
    if title_match:
        title = title_match.group(1)
    
    # Extract description
    description = "Form generated by AI"
    desc_match = re.search(r'"description"\s*:\s*"([^"]+)"', response_text)
    if desc_match:
        description = desc_match.group(1)
    
    # Extract individual fields using regex
    fields = []
    
    # Find all field objects (even partial ones)
    # Pattern matches: {"id":"...", "type":"...", "label":"...", ...}
    field_pattern = r'\{\s*"id"\s*:\s*"([^"]+)"\s*,\s*"type"\s*:\s*"([^"]+)"\s*,\s*"label"\s*:\s*"([^"]+)"([^}]*)\}'
    
    for match in re.finditer(field_pattern, response_text):
        field_id = match.group(1)
        field_type = match.group(2)
        field_label = match.group(3)
        field_rest = match.group(4)
        
        field = {
            "id": field_id,
            "type": field_type,
            "label": field_label,
            "required": True  # Default to required
        }
        
        # Try to extract options if present
        options_match = re.search(r'"options"\s*:\s*\[([^\]]+)\]', field_rest)
        if options_match:
            try:
                # Parse options array
                options_str = '[' + options_match.group(1) + ']'
                options = json.loads(options_str)
                field["options"] = options
            except:
                # Fallback: extract quoted strings
                option_strings = re.findall(r'"([^"]+)"', options_match.group(1))
                if option_strings:
                    field["options"] = option_strings
        
        fields.append(field)
    
    if fields:
        logger.info(f"Extracted {len(fields)} fields from partial JSON")
        return {
            "title": title,
            "description": description,
            "fields": fields
        }
    
    # Fallback: Return basic structure
    logger.warning("Could not extract any fields from response")
    return {
        "title": "Generated Form",
        "description": "Form generated by AI",
        "fields": [],
        "raw_response": response_text[:1000]  # Include first 1000 chars for debugging
    }


def is_final_form(response_text: str) -> bool:
    """
    Detect if LLM response contains final form (not questions)
    
    Args:
        response_text: LLM response text
        
    Returns:
        True if response is final form, False if it's questions
    """
    # Check for explicit mode flag
    if '"mode"' in response_text:
        if '"final_form"' in response_text:
            return True
        if '"questions"' in response_text:
            return False
    
    # Check for form-related keywords
    form_indicators = [
        '"fields"',
        '"field_type"',
        '"form_title"',
        'form specification',
        'complete form',    
        'final form'
    ]
    
    question_indicators = [
        '?',
        'clarifying question',
        'need to know',
        'please specify',
        'would you like'
    ]
    
    form_score = sum(1 for indicator in form_indicators if indicator.lower() in response_text.lower())
    question_score = sum(1 for indicator in question_indicators if indicator.lower() in response_text.lower())
    
    # If form indicators significantly outweigh question indicators, it's likely final form
    return form_score > question_score + 2


def normalize_checkbox_answers(selected_ids: List[str], questions: List[Dict[str, Any]]) -> str:
    """
    Convert selected checkbox IDs to natural language prompt
    
    Args:
        selected_ids: List of selected question IDs
        answers: List of question objects
        
    Returns:
        Natural language string describing selections
    """
    if not selected_ids:
        return "User did not select any options."
    
    # Create a map of ID to label
    id_to_label = {q["id"]: q["label"] for q in questions}
    
    # Get labels for selected IDs
    selected_labels = [id_to_label.get(qid, qid) for qid in selected_ids]
    
    # Convert to natural language
    if len(selected_labels) == 1:
        return f"User selected: {selected_labels[0]}"
    elif len(selected_labels) == 2:
        return f"User selected: {selected_labels[0]} and {selected_labels[1]}"
    else:
        last = selected_labels[-1]
        others = ", ".join(selected_labels[:-1])
        return f"User selected: {others}, and {last}"


def validate_form_schema(form_schema: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validate that form schema has required fields
    
    Args:
        form_schema: Form schema dictionary
        
    Returns:
        Tuple of (is_valid, error_message)              
    """
    if not isinstance(form_schema, dict):
        return False, "Form schema must be a dictionary"
    
    if "title" not in form_schema:
        return False, "Form schema missing 'title' field"
    
    if "fields" not in form_schema:
        return False, "Form schema missing 'fields' array"
    
    if not isinstance(form_schema["fields"], list):
        return False, "'fields' must be an array"
    
    # Validate each field
    for i, field in enumerate(form_schema["fields"]):
        if not isinstance(field, dict):
            return False, f"Field {i} must be a dictionary"
        
        if "id" not in field:
            return False, f"Field {i} missing 'id'"
        
        if "type" not in field:
            return False, f"Field {i} missing 'type'"
        
        if "label" not in field:
            return False, f"Field {i} missing 'label'"
    
    return True, None
