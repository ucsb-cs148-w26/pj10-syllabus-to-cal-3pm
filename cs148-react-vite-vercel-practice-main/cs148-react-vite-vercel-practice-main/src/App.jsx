import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [fileReceived, setFileReceived] = useState(false);
  const [fileName, setFileName] = useState("");

  function handleFile(file) {
    if (file && file.type === "application/pdf") {
      setFileReceived(true);
      setFileName(file.name);
    } else {
      alert("Please upload a PDF file");
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    handleFile(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function handleFileInput(event) {
    const file = event.target.files[0];
    handleFile(file);
  }  

  return (
    <div className="app">
      <div className="navbar">
        <div className="logo">Syllabus-to-Calendar</div>
        <button className="login-button">Login</button>
      </div>

      <main className="content">
        <div
          className={`upload-box ${fileReceived ? "received" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {fileReceived ? (
            <p>✅ HELLO WOrld!! Received: {fileName}</p>
          ) : (
            <>
              <p>Drag & drop a PDF here</p>
              <p>or</p>
              <label className="upload-link">
                click to upload
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileInput}
                  hidden
                />
              </label>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;