"use client";

import { useState } from "react";
import { extractText, getDocumentProxy } from "unpdf";

interface PdfUploadProps {
  onTextExtracted: (text: string) => void;
}

export default function PdfUpload({ onTextExtracted }: PdfUploadProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function getPdfTextFromURL(url: string) {
    const buffer = await fetch(url).then((res) => res.arrayBuffer());
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }

  async function handleFile(fileList: FileList) {
    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i].type !== "application/pdf") {
        setMessage("Only PDF files are allowed.");
        return;
      }
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    for (let i = 0; i < fileList.length; i++) {
      formData.append("file", fileList[i]);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setMessage("Upload failed.");
        setLoading(false);
        return;
      }

      const obj = await res.json();
      const uploadedFiles = obj.uploadedFiles;

      let allText = "";
      for (let i = 0; i < uploadedFiles.length; i++) {
        allText += await getPdfTextFromURL(uploadedFiles[i].url);
      }

      onTextExtracted(allText);
    } catch (err) {
      console.error(err);
      setMessage("Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFile(e.dataTransfer.files);
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
          onChange={(e) => e.target.files && handleFile(e.target.files)}
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