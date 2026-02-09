"use client";

import { useState } from "react";
import { extractText, getDocumentProxy } from "unpdf";
import { Upload as UploadIcon, Loader2 } from "lucide-react";

interface PdfUploadProps {
  onTextExtracted: (text: string) => void;
}

export default function PdfUpload({ onTextExtracted }: PdfUploadProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  async function getPdfTextFromURL(url: string) {
    const buffer = await fetch(url).then((res) => res.arrayBuffer());
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }

  async function handleFile(fileList: FileList) {
    if (!fileList.length) return;

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
        setMessage("Upload failed. Please try again.");
        setLoading(false);
        return;
      }

      const obj = await res.json();
      const uploadedFiles = obj.uploadedFiles as { url: string }[];

      let allText = "";
      for (let i = 0; i < uploadedFiles.length; i++) {
        allText += await getPdfTextFromURL(uploadedFiles[i].url);
      }

      onTextExtracted(allText);
      setMessage(
        uploadedFiles.length === 1
          ? "PDF uploaded successfully. Processing with AI..."
          : `${uploadedFiles.length} PDFs uploaded successfully. Processing with AI...`
      );
    } catch (err) {
      console.error(err);
      setMessage("Upload failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
      setIsDragOver(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      void handleFile(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-2xl px-6 py-10 transition-all cursor-pointer flex flex-col items-center justify-center text-center
          ${isDragOver ? "border-indigo-500 bg-indigo-50/70" : "border-gray-300 bg-gray-50/80 hover:border-indigo-400 hover:bg-indigo-50/60"}
          ${loading ? "opacity-80" : ""}`}
      >
        <input
          type="file"
          accept="application/pdf"
          hidden
          id="pdf-upload"
          multiple
          onChange={(e) => e.target.files && handleFile(e.target.files)}
        />

        {!loading ? (
          <label htmlFor="pdf-upload" className="flex flex-col items-center gap-3 select-none">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm">
              <UploadIcon className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm md:text-base">
                Drag & drop your syllabus PDF here
              </p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                or <span className="text-indigo-600 font-semibold">browse files</span> from your computer
              </p>
              <p className="mt-2 text-[11px] text-gray-400">
                PDF format only · Multiple syllabuses supported
              </p>
            </div>
          </label>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm">
              <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm md:text-base">
                Uploading and reading your PDF files...
              </p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                This may take a few seconds depending on file size.
              </p>
            </div>
          </div>
        )}

        {/* subtle animated glow */}
        <div
          className={`pointer-events-none absolute -inset-px rounded-2xl border border-indigo-400/50 opacity-0
            ${isDragOver ? "animate-pulse opacity-40" : ""}`}
        />
      </div>

      {message && (
        <p className="text-xs md:text-sm text-gray-600">
          {message}
        </p>
      )}
    </div>
  );
}
