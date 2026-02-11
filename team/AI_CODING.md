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

### Tool Used

* ChatGPT (GPT-4)

### What I Did

I used ChatGPT to assist in generating unit tests for our syllabus parsing logic. Specifically, I prompted the model to help create Jest test cases for functions that extract assignment names and due dates from raw syllabus text.

I first provided a simplified version of our parsing function and asked the model to generate:

* Basic correctness tests
* Edge case tests (missing dates, malformed input, empty strings)
* Negative test cases (text without assignment keywords)

After reviewing the generated tests, I refined them to better match our actual implementation and adjusted input/output expectations to align with our real data structure.

### Outcome

* Implemented 3 working Jest unit tests in our codebase
* Improved coverage for edge cases (e.g., undefined input, unexpected formatting)
* Identified one small bug in our parsing logic while testing

Using AI accelerated the brainstorming process for test scenarios and helped me think more systematically about edge conditions. It reduced manual trial-and-error debugging time.

### Reflection
ChatGPT was very useful for generating an initial structure for unit tests and suggesting edge cases I might not have considered immediately. It helped speed up the process of writing test scaffolding and improved my awareness of corner cases.

However, the AI-generated tests were not immediately correct. I needed to sometimes manually verify expected outputs and remove or rewrite assumptions that did not match our implementation. AI sometimes made assumptions about return types or function behavior that were slightly incorrect. Therefore, careful human review and local testing were necessary before committing the code.

Fair Use & Code Quality Considerations:
I ensured that the final test code was adapted to our own implementation and understood every test case before including it.
Going forward, I believe AI tools can significantly improve productivity for generating boilerplate tests and exploring edge cases. However, they should be used as a drafting assistant rather than a replacement for understanding the underlying logic.