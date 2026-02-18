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

<img width="533" height="526" alt="截屏2026-02-12 下午3 38 26" src="https://github.com/user-attachments/assets/afb4bad5-9e7d-4bd9-856f-63aebe47a3d0" />


### Reflection on Usefulness
ChatGPT was very useful for rapid UI brainstorming and prototyping. It allowed me to quickly generate multiple design ideas and explore different layouts. This is helpful during early development stages when we want to experiment with UI improvements efficiently.

However, the generated code still required manual review to ensure it matched our project structure and styling conventions.


### Steps Taken to Ensure Correctness, Clarity, and Fair Use
To ensure the AI output was correct and appropriate:
- Verified it did not introduce unsafe logic or external dependencies
- Ensured the design remained consistent with the original component’s theme
- Treated AI output as a draft and manually refined it before use

In the future, ChatGPT could help with rapid UI prototyping and generating documentation. It is most effective as a support tool rather than a replacement for developer judgment.


## Nataly
### AI Tool: Claude (Anthropic)
### Experiment Procedure:
Instead of focusing on the functionality of our app, we wanted to test how different AI tools redesigned the Profile page component (located in file `Profile.tsx`) such as what UI improvements, layout changes, and more, could be done for a better user experience.

The idea is to keep the same theme of the current Figma styling but improving the layout or seeing what items can be emphasized.

First, I gave Claude a simple, general prompt detailing what I wanted to receive back, given a screenshot of the current profile page.

1. Prompt used:
   > Redesign this Next.js profile page to make it more user-interactive while maintaining visual appeal. Keep the same (tailwind/css) style.
Attached Screenshot:
   <img width="372" height="385" alt="image" src="https://github.com/user-attachments/assets/40c08105-593c-493c-b377-8f65010b4e31" />

### Results
#### First prompt results
Given the first prompt, the AI returned a slightly modified profile page. The biggest changes were that the profile card which had the 'Level' feature was extended, and the colors for specific areas were more accentuated.

<img width="439" height="687" alt="image" src="https://github.com/user-attachments/assets/4b6cfc07-3611-462b-aba3-dab84272e503" />

Since there wasn't really a layout improvement, I gave back another prompt (in the same session) in order to see what additional changes it could make.

2. Prompt used:
   > Now, consider adding some improvements to the UI - is there a better layout for users to interact with?

#### Second prompt results
With this prompt, the Claude AI did return a redesigned layout of the profile page.

<img width="363" height="325" alt="image" src="https://github.com/user-attachments/assets/6f7eec5c-9213-432b-8827-928039418dee" /> <img width="357" height="327" alt="image" src="https://github.com/user-attachments/assets/2341690a-bf33-49ee-8af5-b2164f9c945d" /> <img width="359" height="325" alt="image" src="https://github.com/user-attachments/assets/b5514c7f-e11f-4d50-aa44-28bce483528d" /> <img width="350" height="326" alt="image" src="https://github.com/user-attachments/assets/c6c26674-f633-40d0-8e84-79a8f9229bbd" />

### Reflection
#### Usefulness
I think that Claude AI was a useful tool in redesigning the UI. The AI wasn't restricted by not having the original code to recreate the theme, which was very helpful in simply focusing on brainstorming new layour ideas and color schemes (if that's what we were looking for). As a tool to view different layouts and themes, I think it is a great tool for developers in the early stages of development or for quick UI changes that may serve to elevate user experience.

#### Steps taken for AI Tool
In order to make sure that the AI was correct and fair use, I engineered the first prompt to make sure that only the theme we currently have was the one being used. That is, making sure that there were no external imports to the code that was generated other than what our codebase currently has, and that the theme was visually in accordance to what was first provided. If it were to be used in our project, we would also have to refine it in a way where we use change what was given to better fit our project as well as making sure we are not simply copy-pasting this code and claiming it is ours.


## Wilson Lau 
### AI Tool: Claude (Sonnet 4.5) 
### Goal: 
I used Claude to redesign the Profile page component. The goal was to make the UI more professional and student-oriented (Notion-like), and to make the "Recent Completions" section more functional by adding Canvas/Gradescope links and completion dates for each assignment.
### Procedure: 
Asked Claude "Redesign the profile page to make it more professional and student-like (similar to Notion). Make the recent completions section specific: for each assignment or lab report, show that it can be linked and opened in Canvas or Gradescope, along with the date completed." 
### Results: 
Claude produced a Notion-inspired redesign with:
1. More subtle colors for the page to give a "productive feel"
2. Better layout, less clutter
3. Each item in the recent completion tab has a clickable link to canvas/gradescope 
<img width="766" height="873" alt="Image" src="https://github.com/user-attachments/assets/9e12d426-6da1-428e-9ea3-32bd38094133" />

### Reflection: 
Claude is helpful for rapidly exploring new aesthetics and translating design ideas into Tailwind CSS. It undestands designs without manually importing image designs by simply mentioning "Notion".  It reduced the time spent on layout, spacing, and component structure. 

## Saeed – OpenAI Codex

### AI Tool Used  
OpenAI Codex (via CodeX interface)

---

### Goal  

Instead of focusing on backend functionality, I wanted to experiment with how AI could improve and redesign our frontend components. Our pull request feedback indicated that the frontend needed improvement, and since AI models are particularly strong at generating polished UI layouts, I wanted to evaluate how effectively AI could enhance our design with minimal instruction.

The main goal was to test:
- Whether AI could meaningfully improve our UI
- How much iteration would be required to get useful output
- Whether AI could help speed up frontend refinement

---

### Procedure  

**Prompt 1:**  
> Make any improvements you believe need to be done.

This was intentionally broad to see what the AI would change without heavy constraints and how creative AI is. 

**Result:**  
- Improved spacing and alignment  
- Cleaner layout hierarchy  
- More consistent button styling  
- Better visual balance across sections  

The changes were subtle but made the interface feel more polished.

<img width="1364" height="750" alt="Screenshot 2026-02-13 at 4 21 53 PM" src="https://github.com/user-attachments/assets/c34047c6-f6cb-4d3a-8a21-f5a0c780e352" />

---

**Prompt 2:**  
> Make it more personal to students and give it a sleek design.

 <img width="1357" height="839" alt="Screenshot 2026-02-13 at 3 31 01 PM" src="https://github.com/user-attachments/assets/9962d518-6b64-4d21-92e9-44cf02aa4bdc" />


This prompt was more targeted toward the users for our website, and it was more direct since ChatGPT is great at producing outputs with direct intentions.

It was more personilzed and created a student driven UI that showed their progress and assignments. It also was great on spacing the page. 



---

### Reflection on Usefulness  

Codex was very useful for UI prototyping and iterative refinement. It also can help with small developments but lacks the human intution on how to test. For steps to take to product the correct output, I gave it specific insturctions and a clear output goal. This is a constraint used by AI, and sometimes this is not possible if that chat is too long, so as developer you must know each component of your code to build a project and help fix bugs. 

**Strengths:**
- Quickly generated improved layouts
- Helped reframe content tone for students
- Reduced time spent experimenting with CSS adjustments
- Provided a modern, consistent aesthetic

**Limitations:**
- Output can feel generic without specific prompting
- Creativity is limited unless guided step-by-step
- Does not understand full project context automatically
- Requires manual refinement before integration

Overall, this tool is highly valuable for speeding up app development but it still requires developer judgment to produce a final product. If I were to use this for my app moving foward, I would only use it as a tool for simple coding functions or as startup build for prototyping. 

---

### Steps Taken to Ensure Correctness, Clarity, and Fair Use  

TO ensure that AI is used for correctness is to have it build prootypes of the products but as a developer you should learn the code and how it connects with the project as a whole. If you blindly, believe the code is what you expected from the given output, you can get errors since Chatgpt and any AI is prone to hallucinating. 

**AI tools** From the AI tools provided, was using Chat GPT/CodeX,  I was most excited to use chatgpt since it looks the most promsing. One tip is to be direct, give examples of what you expect, or give clear directions of the ui youd like and a clear output. THe more specfic you are on what you want the better CodeX/Chatgpt is at understanding.  

## Matthew Ahmadpour

### Model: 

Grok Code Fast 1

## Procedure:

For our experiment, we will test the interface generation capabilites of Grok's model. Moreover, we will measure the model's ability to design an appealing interface and come up with valuable features, without the constraint of functionality. 

### Prompt 1


Redesign the profile page to become more appealing as well as interactive and more practical for users. Keep the style the same as the current theme. This should be a prototype; it does not have to be a functional. The design is most salient. Write as many lines of code as needed to accomplish the task.

### Result 1


- Less changes than expected
- Appealing design, albeit minimalistic
- Decent features
- Reasonable, organized layout
- Very fast generation

To have the model provide a more advanced interface design, we provided the model with a second prompt.

### Prompt 2

The current changes are too minimal. Design more significant changes for the protoype. Write as much code needed for a significant redesign that provides all that a user might need in a syllabus to calendar/planner app within the profile page.


### Result 2

<img width="1509" height="865" alt="Screenshot 2026-02-13 at 7 24 25 PM" src="https://github.com/user-attachments/assets/f75f7ee1-bed2-467e-a5a5-1a1cead3633a" />
<img width="1512" height="865" alt="Screenshot 2026-02-13 at 7 24 42 PM" src="https://github.com/user-attachments/assets/e89f6f4c-cf5e-4218-8847-31811932a85c" />
<img width="1512" height="865" alt="Screenshot 2026-02-13 at 7 25 25 PM" src="https://github.com/user-attachments/assets/63d67b92-830e-4ede-8161-12613bac8433" />
<img width="1511" height="865" alt="Screenshot 2026-02-13 at 7 25 00 PM" src="https://github.com/user-attachments/assets/e65fccfa-f198-4c8d-97c8-ff8e5858bf67" />
<img width="1512" height="865" alt="Screenshot 2026-02-13 at 7 26 06 PM" src="https://github.com/user-attachments/assets/b92b9c64-d191-4c69-af12-3ea6e8cd6b1f" />

- Significant changes providing new layout and functionality
- New tabs provide a general, course, planner, achievement, and activity section within the profile page
- Design is more fleshed-out, provides user with a more engaging interface
- Layout is inuitive and easy to navigate
- Slower, but still fast given the scale of change
- 
  ## Reflections

  Grok's model executes commands quite fast, and produced accurate and reasonable code on its first attempt. However, it may lack depth in certain instances, as it initially produced a small amount of changes and had to be prompted again for the redesign. For developers valuing quick execution and small fixes, this model appears ideal. In the future, given a simple task or a series of quick changes (e.g. editing text throughout a file), this model could be very valuable. It may however end up taking more time by having to give mulitple prompts for larger scale changes. Despite the initial lack of depth, the model still produces impressive interface results given the right guidance.

  To ensure accurate and reasonable results, it is imperative that we provided prompts that were highly specific. The model still made mistakes even with lack of specificity, therefore we made sure to test and provide a new prompt that emphasized its errors and our objectives even further. Given that the model only produced a prototype and not functionality, fair use was addressed as we received general ideas rather than specific code that went into our program.


## Rocky Gao - Gemini:
### Background 
I am working on upgrading the frontend to make it more appealing. Specifically I am testing Gemini features on the Profile Page, as it is the most content-heavy and personalized part of the webapp. 
### Goal: 
use AI to generate a UI that is is engaging and cohesive. Stretch the nuances of the LLM to see just how fine grain the customization can get.
### Procedure:
I broke down the frameworks for our website(Next.js, Figma, App Router) to the LLM, then specified what changes I wanted through precise diction, then let it parse through an existing typescript file so it could line-by-line edit/delete/add to what the core code already had. Then I tried integrating it into the actual app on my own branch.
### Results:
The result was impressive. I specified colors Blue and Gold and it delivered. It did not break any existing code, instead it was able to take the old Profile page and rerwork it visually to make it more appealing with different colors. It failed in providing me a properly integrated file so I needed to manually switch around import statements, but overall it works well. Ran into an issue where Gemini would agree with me to a fault, often backtracking on statements regarding logistics.
This can be problematic if I do not specify the correct framework, or if there is a production obstacle in the way as Gemini will not straight up tell you about it, rather making stuff up and sending you on a wild goose chase.

<img width="640" height="449" alt="image" src="https://github.com/user-attachments/assets/9f8613e0-c656-462a-bf34-145cf4a309d9" />

