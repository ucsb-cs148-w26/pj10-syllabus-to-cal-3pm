# CS148 Lab01 HelloWorld Min Viable Product - Rocky Gao

# Description:
Web app frontend only with a User login button and an upload drag n drop box.

# How to use:
* [Stable Vercel URL here](https://cs148-react-vite-vercel-practice.vercel.app/)

# How to recreate(should not be necessary as I already provided a stable URL):
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
8. You should really only need to touch 2 relevant files:
  ```
cs148-react-vite-vercel-practice/src/App.jsx
cs148-react-vite-vercel-practice/src/App.css
```
10. Code your website however you want, just make sure to add the last line in this repo's ```vite.config.js``` file and commit to personal Github repo
11. On Vercel, import that repo and add the following environment variable: ```VITE_BASE_PATH``` with value: ```/```, then deploy
