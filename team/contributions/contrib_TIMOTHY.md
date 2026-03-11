# Pdf Text Extraction
  ### Pdf to Text Function:
  Function to take a pdf file and extract all text into single string
  - issue: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/63
  - pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/118
    
  ### Pdf to Text MVP integration:
  Taking pdf urls from Vercel Blob and feeding them into function
  - issue: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/119#issue-3883763518
  - pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/118






# MVP UI changes 
  #### Changing background color: 
  Bg color to white
  - https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/commit/3afeb138dd67173e8d035da75b65bc8d836710ac
  - https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/commit/81fd6cde243f933819db4de01f2ae847e5661078
  <img width="2879" height="1547" alt="image" src="https://github.com/user-attachments/assets/c74d46d5-a1e4-47d3-a5b7-d8924c8c3dd7" />

  #### Testing text to Pdf rough display: 
  Dumping text from pdfs into the message state
  - https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/commit/3ef4f2a411a5b5f5966b987db6ce2cea2ef33d10
  
  #### Testing text alignment:
  Centered text in MVP
  - https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/commit/0ded92b60d987f8177cfff32f084f076c60a6697
  - https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/commit/c2e448c720bc22318355083c155e29b3f8e5ced3
  - https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/commit/1e5bb073882b1450a9a7978fcb76da9782c4ad61
  - https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/commit/800cd508691626b832caa37e4e697027dcd3f485
  <img width="2818" height="1476" alt="image" src="https://github.com/user-attachments/assets/0e25e4b6-fc68-493b-b7df-6b3a3f10ecbe" />






# NER Training
  ### Script to manually create data: 
  - issue: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/111#issue-3879862143
  - pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/132
  
  ### Edits to manual data creation script for less errors:
  - issue: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/137#issue-3919529379
  - pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/157
  
  ### Trivial Training Sets Creation:
  - issue: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/112#issue-3879872248
  - pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/157


# Upload
  ### File Upload Limit:
  - issue: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/247#issue-4048741750
  - pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/248



# Planner
  ### Priority Score Calculation for Events:
  - issue: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/159#issue-3959586040
  - pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/166

  ### Study List Organization Based on Priority Scoring:
  Sorted in order of score
  - issue: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/189#issue-3986757882
  - pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/190
  <img width="1869" height="1280" alt="image" src="https://github.com/user-attachments/assets/d0ceb14f-5d34-4acb-94a8-b9517e2eb580" />

  ### Planner Tuning Priority score calculation and thresholds to conform to desired behavior
  - pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/232





  
# Debugging
  ### Filling class field in CalendarEvent, bug fixing for PR (worked with Nataly)
  - https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/218/changes/45f0d7720ec3decf7799156b3e4e184914beb135
  ### Fixed accessToken missing error in calendar creation feature
  - pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/234
# Note: 
Most of time spent on manually creating datasets. Realized that model could not be trained from scratch in time, as model was at 20% performance score by the halfway mark of the quarter; pivoted to Gemini. 
