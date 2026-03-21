# Syllabus to Calendar

Syllabus to Calendar is a web app where users can upload their class syllabus, automatically extract events, and upload them to their Google Calendar. The app's mission is to provide users with three core components that many LLM alternatives lack: speed, security, and readability. Users are provided with new features like a non-CSV review interface with built-in editing, automatic calendar upload, a warning system for extracted events without dates, Google Calendar interaction within the app, and a course planner to view upcoming deadlines and their estimated priority. By improving the process of class organization, Syllabus to Calendar supports students by encouraging responsiblity and structure within each of their courses.

## Tech Stack
* Vercel, Vercel Blob, React, Next.js, Gemini, PyMuPDF, SpaCy, Supabase, OAuth, Google Calendar API 

## Members
| Name | Github ID |
|------|-----------|
| Matthew Ahmadpour | yzdemo | 
| Wilson Lau | Wilson730 |
| Rocky Gao | rockygao2020 |
| Nataly Gonzalez Ornelas | n-ornelas |
| Lucy Deng | DengLucy |
| Timothy Lou | TimatoPaste |
| Saeed Arellano | saeed-ar |

## User Role & Permissions

### Student
Student user can only access the calendar process for themselves. They will not be able to control, nor be able to access, the calendar process for other student users.
  
### Permissions
#### Upload
- Uploading files (PDF, DOCX, TXT, PNG, JPG/JPEG)
- Writing generation prompts
- Generating calendars
- Adding, editing, and removing generated events
- Connecting Google accounts
- Exporting to Google Calendar
- Uploading to planner

#### Calendar
- Viewing Google Calendar
- Editing Google Calendar

#### Planner
- Adding, editing, and deleting courses
- Adding, editing, and deleting assignments
- Completing assignments

#### Settings
- Changing account email
- Changing account password

## Testing

### Syllabus to Calendar v.3.0.0

1. Clone the repository
```
git clone https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm.git
```
2. Access the repository
```
cd pj10-syllabus-to-cal-3pm
```
3. Install dependencies
```
npm i
```
4. Run locally
```
npm run dev
```

## Structure

### Features

- Uploads.tsx: Calendar upload and generation
- Calendar.tsx: Google Calendar view
- StudyPlan.tsx: Planner and course tracker
- Profile.tsx: Change account information
```
components/figma-app/components/features/Uploads.tsx
components/figma-app/components/features/Calendar.tsx
components/figma-app/components/features/StudyPlan.tsx
components/figma-app/components/features/Profile.tsx
```
## Functionality

All features are implemented with the goal of providing at least one of three benefits to users: speed, security, and readability.

- Upload syllabus files in different formats and automatically generate calendar events.
- View generated files and make edits within the interface.
- Sort viewed events by type, including lecture, assignment, and exam.
- Provide prompts and select extracted event type (e.g., exams only).
- Receive warnings for invalid events (e.g., missing time) without them being ignored or including false assumptions
- Upload to Google Calendar
- View deadlines in planner and receive real-time priority levels for each exam and assignment
- Customize class priorities to better reflect deadline importance
- View and make edits to Google Calendar within the website
- Download files to add them to other platforms such as Notion
  
# Deployment

Users can use the app by opening the link below. To access all of the app's features, new users are led to the login page to register an account or to connect their Google Account.

https://pj10-syllabus-to-cal-3pm-beta.vercel.app
