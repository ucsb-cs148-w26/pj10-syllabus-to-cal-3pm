## Timothy - Deepseek:
### Background 
I am working on training a NER to label lectures, assignments, assessments, and sections. First, I will have to manually create enough datasets to train the model to have decent accuracy. Then, I can introduce new data to the model and verify its matches to create new training sets. However, I am wondering if I can use AI to speed up the initial process of creating data manually
### Goal: 
use AI to create training sets for NER to recognize lectures, assignments, assessments, and sections.
### Procedure
I passed in various syllabus pdfs from the dataset into DeepSeek and asked it to create a training set for a SpaCy NER with labels LECTURES, ASSIGNMENTS, ASSESSMENTS, and SECTIONS, including the specific dates and topics of each ent.
### Results
The output had some problems:
1. The train set created by DeepSeek used sentences as documents, which could remove context that is needed add nuance to labeling (like understanding the difference between a section and a lecture). I attempted to have the model switch to using paragraphs, but it just kept using sentences.
2. The train set frequently included "entire semester," "weekly," or the ith week as a date in the ent info
3. The train set would frequently combine lectures and assessments into the same entity under the same label
4. The train set misidentified some lectures as sections and vice versa
5. The train set omits crucial details about lectures or assignments even when they are in the doc text
### Notes
This tool created a large amount of training data quickly, but the data was definitely flawed. I'd have to manually check and fix each generated ent for the sets to actually be useful; at that point, it would be easier and more consistent to use the annotation script I wrote to generate sets. DeepSeek is better for suggesting libraries, functions, and algorithms to solve certain problems than it is for creating datasets, so I do not think it can help the NLP part of this project much. 
