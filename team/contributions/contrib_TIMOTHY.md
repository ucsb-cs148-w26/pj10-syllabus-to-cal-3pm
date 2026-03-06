- PDF text extraction
- MVP integration of text extraction 
- MVP text centering for text display
- NLP NER training in early quarter (scripts to create training sets, set creation, raw data collection, training models)
- much of the training and set creation work was done outside of github due to large file sizes
- Priority scoring function + Study Scheduler backend

## Pdf Text Extraction
### Pdf to Text Function:
issue: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/63
pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/118

### MVP UI changes 
#### Changing background color: 
- https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/commit/3afeb138dd67173e8d035da75b65bc8d836710ac
- https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/commit/81fd6cde243f933819db4de01f2ae847e5661078
#### Testing text to Pdf rough display: 
https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/commit/3ef4f2a411a5b5f5966b987db6ce2cea2ef33d10
#### Testing text alignment:
- https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/commit/0ded92b60d987f8177cfff32f084f076c60a6697
- https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/commit/c2e448c720bc22318355083c155e29b3f8e5ced3
- https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/commit/1e5bb073882b1450a9a7978fcb76da9782c4ad61
- https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/commit/800cd508691626b832caa37e4e697027dcd3f485

### Pdf to Text MVP integration:
issue: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/119#issue-3883763518
https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/118

## NER Training
### Script to manually create data: 
issue: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/111#issue-3879862143
pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/132

### Edits to manual data creation script for less errors:
issue: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/137#issue-3919529379
pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/157

### Trivial Training Sets Creation:
issue: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/112#issue-3879872248
pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/157

## Study Planner
### Priority Score Calculation for Events:
issue: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/159#issue-3959586040
pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/166

### Study List Organization Based on Priority Scoring:
issue: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/issues/189#issue-3986757882
pr: https://github.com/ucsb-cs148-w26/pj10-syllabus-to-cal-3pm/pull/190

Note: Most of time spent on manually creating datasets. Realized that model could not be trained from scratch in time, as model was at 20% performance score by the halfway mark of the quarter; pivoted to Gemini.
