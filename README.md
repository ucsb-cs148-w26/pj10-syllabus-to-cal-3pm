# HelloWorld CS148-react-vite-vercel MVP - Rocky Gao

# Description:
Web app frontend only with a User login button and an upload drag n drop box. Upon dragging a PDF to the box, the webpage signals a "Hello World!" message. Uses React+Vite deployed with Vercel. 

# How to use:
* [Click the Stable URL](https://cs148-react-vite-vercel-practice.vercel.app/)

# How to recreate:
* Logistics Note: The [lab01 instructions](https://edstem.org/us/courses/90881/lessons/155706/slides/908999) states that we should vary our frameworks, but also create pull requests for each hello world app. The frameworks used in my webapp are not compatible with the software we plan to use in the final product, so I have taken precautionary steps to mitigate the potential disaster of an accidental merge to main. The helloworld app resides solely in the directory named ```cs148-react-vite-vercel-practice-main```, unrelated to the rest of the repo, which retains the contents of main save the README file. This way in the event that during the grading process this branch supersedes main on accident, no progress will be lost. Below is a tutorial on how to recreate the webapp locally.
1. Install Node.js LTS (if not already)
```
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts
```
2. Create a new Vite React project (npm downloads both toolkits)
```
npm create vite@latest my-app -- --template react
```
3. Enter project folder
```
cd my-app
```
5. Install dependencies
```
npm install
```
7. Start dev server
```
npm run dev
```
8. You should really only need to replace 2 relevant files:
  ```
cs148-react-vite-vercel-practice/src/App.jsx
cs148-react-vite-vercel-practice/src/App.css
```
10. Code your website however you want, just make sure to add the last line in this repo's ```cs148-react-vite-vercel-practice-main/vite.config.js``` file and commit to personal Github repo
11. On Vercel, import that repo and add the following environment variable: ```VITE_BASE_PATH``` with value: ```/```, then deploy
