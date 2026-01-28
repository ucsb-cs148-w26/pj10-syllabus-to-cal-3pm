import os
from google import genai

client = genai.Client(api_key=os.environ['GEMINI_API_KEY'])

def generate_calendar_csv(text_file, filters):
    """Input: text_file: file with syllabus transcript as a string, filters: list of desired events to be extracted, such as homework or lecture time
       Output: CSV file in Google Calendar format, needs to be exported to notepad, formatted in plain text, then imported  to google calendar"""
    
    file_content = open(text_file).read()

    prompt = f'''
    
    You will recieve a transcript of a syllabus from a class. 
    
    Extract any events that fall under the following categories:{filters}. 

    Some categories may not appear in the syllabus. Ignore any other information not related to these events. For example, if a homework category is not provided but present in the syllabus then do not include it in the calendar.
    
    Finally, you will ouput a CSV file with these events to import into Google Calendar. Only provide the file; no markdown or additional text. Here is the syllabus transcript: {file_content}    
    '''

    response = client.models.generate_content(
        model = 'gemini-2.5-flash', contents = prompt
    )

    csv_file = response.text.strip()

    return csv_file

# change this to whatever you want :)))

csv_sample = generate_calendar_csv('generator/syllabus.txt', "homework, lecture, midterm, final")

with open('events.csv', 'w', encoding='utf=8') as csv:
    csv.write(csv_sample)