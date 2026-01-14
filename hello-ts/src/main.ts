const text = document.getElementById("text")!
const button = document.getElementById("btn")!

let isHelloWorld = true

button.addEventListener("click", () => {
  if (isHelloWorld) {
    text.textContent = "My name is Lucy."
  } else {
    text.textContent = "Hello World! "
  }
  isHelloWorld = !isHelloWorld
})
