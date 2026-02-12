## Timothy - Deepseek:
### Background 
I am working on training a NER to label lectures, assignments, assessments, and sections. First, I will have to manually create enough datasets to train the model to have decent accuracy. Then, I can introduce new data to the model and verify its matches to create new training sets. However, I am wondering if I can use AI to speed up the initial process of creating data manually
### Goal: 
use AI to create training sets for NER to recognize lectures, assignments, assessments, and sections.
### Procedure:
I passed in various syllabus pdfs from the dataset into DeepSeek and asked it to create a training set for a SpaCy NER with labels LECTURES, ASSIGNMENTS, ASSESSMENTS, and SECTIONS, including the specific dates and topics of each ent.
### Results:
The output had some problems:
1. The train set created by DeepSeek used sentences as documents, which could remove context that is needed add nuance to labeling (like understanding the difference between a section and a lecture). I attempted to have the model switch to using paragraphs, but it just kept using sentences.
2. The train set frequently included "entire semester," "weekly," or the ith week as a date in the ent info
3. The train set would frequently combine lectures and assessments into the same entity under the same label
4. The train set misidentified some lectures as sections and vice versa
5. The train set omits crucial details about lectures or assignments even when they are in the doc text
### Notes:
This tool created a large amount of training data quickly, but the data was definitely flawed. I'd have to manually check and fix each generated ent for the sets to actually be useful; at that point, it would be easier and more consistent to use the annotation script I wrote to generate sets. DeepSeek is better for suggesting libraries, functions, and algorithms to solve certain problems than it is for creating datasets, so I do not think it can help the NLP part of this project much. 


## Lucy Deng

### AI Tool Used: ChatGPT (OpenAI)


### Task / Experiment
I used ChatGPT to redesign the UI of the existing component:

`cs148-app/components/figma-app/components/features/Profile.tsx`

The goal was to explore AI’s ability to generate improved UI prototypes while keeping the same theme (student profile, progress tracking, and achievements). The experiment focused on visual design and interactivity.



### Prompt Used
Redesign this React/Next.js Profile.tsx component to make it more modern, interactive, and visually appealing while keeping the same theme and Tailwind styling. Add UI improvements such as better layout hierarchy and smoother visual feedback. Functionality does not need to change.


### Outcomes Produced
ChatGPT generated a redesigned layout with clearer visual hierarchy and improved organization of profile statistics and progress indicators. This helped quickly prototype alternative UI ideas without manually redesigning from scratch.


### Reflection on Usefulness
ChatGPT was very useful for rapid UI brainstorming and prototyping. It allowed me to quickly generate multiple design ideas and explore different layouts. This is helpful during early development stages when we want to experiment with UI improvements efficiently.

However, the generated code still required manual review to ensure it matched our project structure and styling conventions.


### Steps Taken to Ensure Correctness, Clarity, and Fair Use
To ensure the AI output was correct and appropriate:
- Verified it did not introduce unsafe logic or external dependencies
- Ensured the design remained consistent with the original component’s theme
- Treated AI output as a draft and manually refined it before use

In the future, ChatGPT could help with rapid UI prototyping and generating documentation. It is most effective as a support tool rather than a replacement for developer judgment.
