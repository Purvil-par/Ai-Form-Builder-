"""
Form Type Prompts Module
Contains pre-written detailed prompts for each form type
"""

FORM_TYPE_PROMPTS = {
    "application": """You are creating an Application Form. This form is typically used for job applications, membership applications, or program applications.

Expected data to collect:
- Personal information (name, contact details)
- Relevant experience or qualifications
- Supporting documents (resume, certificates)
- References (optional)

Ask clarifying questions to understand:
1. What type of application is this? (job, membership, program, etc.)
2. What specific information is required?
3. Are file uploads needed for documents?0
4. Should there be a section for references?
5. Are there specific qualifications or experience fields needed?

Once you have enough information, generate a complete form specification with appropriate field types and validation.

Remember to respond in the required JSON format with mode flag.""",

    "registration": """You are creating a Registration Form. This form is used for event registration, course enrollment, or user sign-ups.

Expected data to collect:
- Basic user information (name, email, phone)
- Registration details (event/course selection, preferences)
- Payment information (if applicable)
- Emergency contact (for events)
- Dietary restrictions or special requirements

Ask clarifying questions to understand:
1. What is being registered for? (event, course, service, etc.)
2. Is payment collection required?
3. Are there multiple options or tiers to choose from?
4. Is emergency contact information needed?
5. Should there be fields for special requirements or preferences?

Generate a structured form with appropriate fields and validation rules.

Remember to respond in the required JSON format with mode flag.""",

    "feedback": """You are creating a Feedback Form. This form collects user opinions, reviews, or suggestions about products, services, or experiences.

Expected data to collect:
- Rating scales (satisfaction, quality, etc.)
- Open-ended feedback comments
- Category selection (what aspect of service/product)
- Contact information (optional for follow-up)
- Recommendation likelihood

Ask clarifying questions:
1. What is the feedback about? (product, service, event, website, etc.)
2. Should ratings be numeric (1-5, 1-10) or categorical (Poor/Good/Excellent)?
3. Are there specific aspects to rate separately?
4. Should contact information be collected for follow-up?
5. Do you want a Net Promoter Score (NPS) question?

Create a form that makes it easy for users to provide structured feedback.

Remember to respond in the required JSON format with mode flag.""",

    "admission": """You are creating an Admission Form. This form is used for school, college, or course admissions.

Expected data to collect:
- Student personal information
- Academic history and qualifications
- Guardian/parent information
- Previous education details
- Supporting documents (transcripts, certificates)
- Statement of purpose or essay

Ask clarifying questions:
1. What level of education is this for? (school, college, graduate program, etc.)
2. Are guardian details required?
3. Should there be fields for previous academic records?
4. Are essay or statement of purpose fields needed?
5. What documents need to be uploaded?

Generate a comprehensive admission form with proper validation.

Remember to respond in the required JSON format with mode flag.""",

    "survey": """You are creating a Survey Form. This form is used for market research, opinion polls, or data collection studies.

Expected data to collect:
- Demographic information (age, location, etc.)
- Multiple choice questions
- Rating scales
- Open-ended responses
- Conditional questions based on previous answers

Ask clarifying questions:
1. What is the survey topic or purpose?
2. How many questions should there be approximately?
3. What types of questions are needed? (multiple choice, ratings, open-ended)
4. Should demographic information be collected?
5. Are there any conditional/branching questions?

Create a well-structured survey form with varied question types.

Remember to respond in the required JSON format with mode flag.""",

    "consent": """You are creating a Consent Form. This form is used for legal consent, agreements, or permissions.

Expected data to collect:
- Participant/user information
- Clear consent statements
- Signature or acknowledgment
- Date of consent
- Witness information (if required)
- Specific permissions or opt-ins

Ask clarifying questions:
1. What type of consent is this for? (medical, research, data processing, etc.)
2. Are there multiple consent items to agree to?
3. Is a digital signature required?
4. Should witness information be collected?
5. Are there any specific legal disclaimers to include?

Generate a clear consent form with explicit agreement fields.

Remember to respond in the required JSON format with mode flag.""",

    "order": """You are creating an Order Form. This form is used for product orders, service bookings, or purchase requests.

Expected data to collect:
- Customer information
- Product/service selection
- Quantity and specifications
- Delivery/shipping address
- Payment method
- Special instructions

Ask clarifying questions:
1. What type of products or services are being ordered?
2. Should there be quantity selectors?
3. Is shipping/delivery address needed?
4. What payment methods should be supported?
5. Are there product variations or options to select?

Create an order form with clear product selection and checkout fields.

Remember to respond in the required JSON format with mode flag.""",

    "complaint": """You are creating a Complaint Form. This form is used for customer complaints, issue reporting, or grievance submissions.

Expected data to collect:
- Complainant information
- Nature of complaint (category)
- Detailed description of issue
- Date/time of incident
- Supporting evidence (file uploads)
- Desired resolution
- Priority/severity level

Ask clarifying questions:
1. What type of complaints will this handle? (product, service, workplace, etc.)
2. Should there be predefined complaint categories?
3. Is file upload needed for evidence?
4. Should there be a priority or severity selector?
5. Do you want a field for desired resolution?

Generate a complaint form that captures all necessary details for resolution.

Remember to respond in the required JSON format with mode flag.""",

    "request": """You are creating a Request Form. This form is used for service requests, information requests, or general inquiries.

Expected data to collect:
- Requester information
- Type of request (category)
- Detailed description
- Urgency level
- Preferred contact method
- Additional requirements

Ask clarifying questions:
1. What type of requests will this handle? (service, information, support, etc.)
2. Should there be predefined request categories?
3. Is urgency/priority selection needed?
4. Should there be fields for preferred response time?
5. Are there any specific requirements or attachments needed?

Create a request form that clearly captures the nature and details of requests.

Remember to respond in the required JSON format with mode flag.""",

    "evaluation": """You are creating an Evaluation/Assessment Form. This form is used for performance reviews, assessments, or evaluations.

Expected data to collect:
- Subject being evaluated (person, project, etc.)
- Evaluator information
- Multiple criteria with ratings
- Strengths and weaknesses
- Comments and recommendations
- Overall score or grade

Ask clarifying questions:
1. What is being evaluated? (employee, student, project, program, etc.)
2. What criteria should be assessed?
3. What rating scale should be used? (1-5, 1-10, letter grades, etc.)
4. Should there be sections for strengths and areas for improvement?
5. Is an overall score or recommendation needed?

Generate a comprehensive evaluation form with structured rating criteria.

Remember to respond in the required JSON format with mode flag.""",
}


def get_form_prompt(form_type: str) -> str:
    """
    Get the pre-written prompt for a specific form type
    
    Args:
        form_type: The form type identifier (e.g., 'application', 'registration')
        
    Returns:
        The detailed prompt string for that form type
        
    Raises:
        ValueError: If form_type is not recognized
    """
    if form_type not in FORM_TYPE_PROMPTS:
        raise ValueError(f"Unknown form type: {form_type}. Valid types: {list(FORM_TYPE_PROMPTS.keys())}")
    
    return FORM_TYPE_PROMPTS[form_type]


def get_available_form_types() -> list[str]:
    """
    Get list of all available form types
    
    Returns:
        List of form type identifiers (includes 'blank' for user-defined prompts)
    """
    # Include predefined types + blank
    return list(FORM_TYPE_PROMPTS.keys()) + ["blank"]


def is_blank_form(form_type: str) -> bool:
    """
    Check if form type is blank (user-defined)
    
    Args:
        form_type: The form type identifier
        
    Returns:
        True if blank form, False otherwise
    """
    return form_type == "blank"


def wrap_user_prompt(user_prompt: str) -> str:
    """
    Wraps user-defined prompt with guardrails and instructions
    
    This ensures that user prompts are properly guided through the AI flow
    with appropriate validation and question-asking behavior.
    
    Args:
        user_prompt: The raw user-provided prompt
        
    Returns:
        Wrapped prompt with instructions and guardrails
    """
    return f"""User wants to create a custom form with the following description:

"{user_prompt}"

INSTRUCTIONS:
- Carefully analyze the user's request to understand their form requirements
- If the description is clear and detailed with specific fields mentioned, you may proceed to generate the form
- If the description is vague, missing key details, or unclear, ask clarifying questions first
- Use checkbox-style questions for user selections (each question should be a yes/no or selection option)
- Ask specific, targeted questions about:
  * What information needs to be collected
  * Which fields should be required vs optional
  * What validation rules are needed
  * Whether file uploads are needed
  * Any specific field types or constraints
- Maximum 2-3 rounds of questions should be sufficient
- Once you have enough information to create a complete, usable form, generate the final form immediately
- Remember to respond in the required JSON format with mode flag ("questions" or "final_form")

GUARDRAILS:
- Do not generate incomplete or poorly structured forms
- Do not ask unnecessary questions if the user prompt is already detailed
- Do not exceed 3 rounds of clarifying questions
- Always ensure the final form has proper validation and required field markers

Analyze the user's request and proceed accordingly."""
