import os
from google import genai

client = genai.Client(api_key=os.environ['GEMINI_API_KEY'])
def generate_calendar_csv(events):
    """Input: List of event objects
       Output: CSV file in Google Calendar format"""
    
    prompt = f"Convert the provided events into CSV format to import into Google Calendar. Only provide the raw file, no explanations or additional text. Events: {events}" # TODO: EVENT INTEGRATION/RULES

    response = client.models.generate_content(
        model = "gemini-2.5-flash", contents = prompt
    )

    csv_file = response.text.strip()

    return csv_file
