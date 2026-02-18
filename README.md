# Syllabus to Calendar App

  This is a code bundle for Syllabus to Calendar App. The original project is available at https://www.figma.com/design/DgMiIzFMejBtVBljQArVaA/Syllabus-to-Calendar-App.
  
  Current working deployment on Vercel deriving from `main` branch. https://syllabitocal.vercel.app 
  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
# Syllabus To Calendar

Web app where users can recieve a complete class calendar by providing their syllabus. Users only need to provide files, press on a button, and import a file into their calendar. The app provides customization through filters and user prompts to generate calendars that meet the user's needs. For example, they can include lectures but not homework deadlines. It also incorporates validation steps such as event review which allow user to review and make changes with convenience. Furthermore, the app is designed to provide comparable accuracy and customization to manually written calendars without the same time investment. 

## Tech Stack
* Vercel, React, Next.js, Gemini, PyMuPDF, SpaCy, Python

## Members
| Name | Github ID |
|------|-----------|
| Matthew | yzdemo | 
| Wilson Lau | Wilson730 |
| Rocky Gao | rockygao2020 |
| Nataly Gonzalez Ornelas | n-ornelas |
| Lucy Deng | DengLucy |
| Timothy Lou | TimatoPaste |
| Saeed Arellano | saeed-ar |

## User Role(s) & Permissions
### Student
Student user can only access the calendar process for themselves. They will not be able to control, nor be able to access, the calendar process for other student users.
  
#### Permissions
- Uploading (PDF, Text, PNG)
- Calendar Generation

## Dependencies
- googleapis: google calendar access
- next: next.js framework
- next-auth: sign-in process
- react: react framework
- react-dom: routing
- unpdf: pdf text extraction
# Functionality
- Log in
- Drop files into uploader
- Observe pdf text
- Download .csv file
- Click calendar button
- Observe new google calendar events in Google Calendar

# Known Problems
## Only one event extracted
- If upload pdf, sometimes only one event will be extracted
## Inconsistent text to csv conversion
- After uploading files, csv is not always available for use

