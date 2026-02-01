"use client";

import { useState } from "react";

export default function PdfUpload() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setMessage("❌ Only PDF files are allowed.");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
    
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    setLoading(false);

    if (res.ok) {
      setMessage("✅ You've completed an upload!");
    } else {
      setMessage("❌ Upload failed.");
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center cursor-pointer"
      >
        <input
          type="file"
          accept="application/pdf"
          hidden
          id="pdf-upload"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <label htmlFor="pdf-upload" className="cursor-pointer">
          📄 Drag & drop a PDF here, or click to upload
        </label>
      </div>

      {loading && <p className="mt-4">Uploading…</p>}
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
