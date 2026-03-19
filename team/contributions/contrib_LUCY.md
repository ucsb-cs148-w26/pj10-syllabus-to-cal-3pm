## Lucy – Contributions

- Refined the AI prompt to ensure the system extracts only lectures, assignments, and exams while excluding holidays and office hours with slow noise.
- NLP training data set creation. 
- Tested the consistency and effectiveness of the AI prompt through trails of testings. 
- Implemented CSV output formatting and normalization to enforce the schema:
  title,start,allDay,description,location,class.
- Added support for an additional `class` column in the generated CSV to store course identifiers.
- Modified logic to convert extracted event data(with an extra column 'class') into Google Calendar–compatible formats.
- Updated the frontend event processing pipeline to handle the new 6‑column CSV format.
- Fixed formatting bugs related to newline separation between CSV headers and rows.
- Helped debug issues where AI output formatting caused unpleasent format in the frontend.
- Participated in debugging and testing the syllabus extraction pipeline using real syllabus PDFs.
- Created prompt box for user customize the calender upload option.

[#238](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/238) - Added an extra rule to gemini  
[#204](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/204) - Ld prompt box  
[#188](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/188) - Changed prompt as well as fixed the spacing issue in show raw csv  
[#163](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/163) - Add more options for files type  
[#146](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/146) - Accuracy test & short report for gemini performance  
[#125](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/125) - modified Ul for login page  
[#117](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/117) - Id- google login page  
[#77](https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/77) - LD - Convert texts to events  


