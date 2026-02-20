"use client";

import { useState, useEffect } from "react";
import { extractText, getDocumentProxy } from "unpdf";
import { Upload as UploadIcon, Loader2, Trash2, FileText } from "lucide-react";

interface PdfUploadProps {
  onTextExtracted: (text: string, uploaded?: { filename: string; url: string }[]) => void;
  /** Optional: enables rendering a file list with per-file delete actions. */
  uploadedFiles?: { filename: string; url: string }[];
  /** Optional: called when the user deletes a single uploaded file from the list. */
  onDeleteUploadedFile?: (filename: string) => Promise<void> | void;
}

export default function PdfUpload({
  onTextExtracted,
  uploadedFiles,
  onDeleteUploadedFile,
}: PdfUploadProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // When the uploaded file list changes (e.g. deletions), recompute the combined text
  // from the remaining files so removed files don’t continue contributing to processing.
  useEffect(() => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const files = uploadedFiles;

    let cancelled = false;

    async function recompute() {
      try {
        setMessage("");
        const texts = await Promise.all(files.map((f) => getPdfTextFromURL(f.url)));
        if (cancelled) return;
        onTextExtracted(texts.join(""), files);
      } catch {
        // Silent: deletions shouldn't spam errors; the next upload/process will refresh.
      }
    }

    void recompute();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFiles?.map((f) => f.filename).join("|")]);

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
      const uploaded = obj.uploadedFiles as { filename: string; url: string }[];

      let allText = "";
      for (let i = 0; i < uploaded.length; i++) {
        allText += await getPdfTextFromURL(uploaded[i].url);
      }

      onTextExtracted(allText, uploaded);
    } catch (err) {
      console.error(err);
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

  const showList = !!uploadedFiles && uploadedFiles.length > 0;

  return (
    <div className="space-y-4">
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
              <p className="font-medium text-gray-900 text-sm md:text-base">Drag or Click to Browse</p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
               PDF format supported
              </p>

            </div>
          </label>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full max-w-sm">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm">
              <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm md:text-base">Uploading and reading your PDF files...</p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                This may take a few seconds depending on file size.
              </p>
            </div>
          </div>
        )}

        <div
          className={`pointer-events-none absolute -inset-px rounded-2xl border border-indigo-400/50 opacity-0
            ${isDragOver ? "animate-pulse opacity-40" : ""}`}
        />
      </div>

      {message && <p className="text-xs md:text-sm text-gray-600">{message}</p>}

      {showList && (
        <div className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <FileText className="h-4 w-4 text-indigo-600" />
              Uploaded files
            </div>
            <div className="text-xs text-gray-500">{uploadedFiles!.length}</div>
          </div>

          <div className="max-h-44 overflow-y-auto pr-1">
            <ul className="space-y-2">
              {uploadedFiles!.map((f) => (
                <li
                  key={f.filename}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{f.filename}</p>
                    {/* removed: 'Stored and ready' */}
                  </div>

                  {onDeleteUploadedFile ? (
                    <button
                      type="button"
                      onClick={() => void onDeleteUploadedFile(f.filename)}
                      className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                      aria-label={`Delete ${f.filename}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
