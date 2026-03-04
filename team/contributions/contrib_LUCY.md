## Lucy – Contributions

- Designed and refined the AI prompt to ensure the system extracts only lectures, assignments, and exams while excluding holidays and office hours.
- Implemented CSV output formatting and normalization to enforce the schema:
  title,start,allDay,description,location,class.
- Added support for an additional `class` column in the generated CSV to store course identifiers.
- Built logic to convert extracted event data into Google Calendar–compatible formats.
- Updated the frontend event processing pipeline to handle the new 6‑column CSV format.
- Fixed formatting bugs related to newline separation between CSV headers and rows.
- Helped debug issues where AI output formatting caused unpleasent format in the frontend.
- Participated in debugging and testing the syllabus extraction pipeline using real syllabus PDFs.
- Created prompt box for user customize the calender upload option.
