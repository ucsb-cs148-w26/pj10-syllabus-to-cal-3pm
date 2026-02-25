"use client";

import { useEffect, useRef, useState } from "react";
import { extractText, getDocumentProxy } from "unpdf";
import { Upload as UploadIcon, Loader2, Trash2, FileText } from "lucide-react";
import { FILE_ACCEPT_ATTR, validateUploadFile } from "@/lib/fileValidation";

type UploadedFileMeta = { filename: string; url: string };

interface UploadProps {
  onTextExtracted: (text: string, uploaded?: UploadedFileMeta[]) => void;
  uploadedFiles?: UploadedFileMeta[];
  onDeleteUploadedFile?: (filename: string) => Promise<void> | void;
}

function extOf(nameOrUrl: string) {
  const clean = (nameOrUrl || "").split("?")[0].toLowerCase();
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot) : "";
}

function isImageExt(ext: string) {
  return ext === ".png" || ext === ".jpg" || ext === ".jpeg";
}

export default function PdfUpload({ onTextExtracted, uploadedFiles, onDeleteUploadedFile }: UploadProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Recompute transcript when uploaded list changes (e.g., deletions)
  useEffect(() => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    let cancelled = false;

    async function recompute() {
      try {
        setMessage("");
        const texts = await extractAllTexts(uploadedFiles);
        if (cancelled) return;
        const transcript = texts.filter(Boolean).join("\n\n").trim();
        onTextExtracted(transcript, uploadedFiles);
      } catch {
        // silent
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

  async function getTxtTextFromURL(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch txt (HTTP ${res.status})`);
    return (await res.text()).trim();
  }

  async function getDocxTextFromURL(url: string) {
    const res = await fetch("/api/extract-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || `DOCX extract failed (HTTP ${res.status})`);
    }
    return String(data?.text || "").trim();
  }

  async function getImageOcrTextFromURL(url: string) {
    const res = await fetch("/api/vision-ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url }),
    });
    const data = await res.json().catch(() => ({}));

    // support both { text } and { success, text }
    if (!res.ok) {
      throw new Error(data?.error || `OCR failed (HTTP ${res.status})`);
    }
    if (data?.success === false) {
      throw new Error(data?.error || "OCR failed");
    }

    return String(data?.text || "").trim();
  }

  async function extractAnyTextFromURL(url: string, filename?: string) {
    const ext = extOf(filename || url);

    if (ext === ".pdf") return await getPdfTextFromURL(url);
    if (ext === ".docx") return await getDocxTextFromURL(url);
    if (ext === ".txt") return await getTxtTextFromURL(url);
    if (isImageExt(ext)) return await getImageOcrTextFromURL(url);

    return "";
  }

  // Sequential extraction keeps OCR stable (avoids rate limit / burst failures)
  async function extractAllTexts(files: UploadedFileMeta[]) {
    const results: string[] = [];
    for (const f of files) {
      results.push(await extractAnyTextFromURL(f.url, f.filename));
    }
    return results;
  }

  async function uploadFiles(files: File[]) {
    const formData = new FormData();
    for (const f of files) formData.append("file", f);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || `Upload failed (HTTP ${res.status})`);
    }
    const obj = await res.json();
    return obj.uploadedFiles as UploadedFileMeta[];
  }

  async function handleFiles(fileList: FileList) {
    const picked = Array.from(fileList ?? []);
    if (picked.length === 0) return;

    const ok: File[] = [];
    for (const f of picked) {
      const v = validateUploadFile(f);
      if (!v.ok) {
        setMessage(v.error); // Scenario 2: MP3 -> "not supported"
        continue;
      }
      ok.push(f);
    }
    if (ok.length === 0) return;

    setLoading(true);
    setMessage("");

    try {
      const uploaded = await uploadFiles(ok);

      const texts = await extractAllTexts(uploaded);
      const transcript = texts.filter(Boolean).join("\n\n").trim();

      if (!transcript) {
        setMessage("Uploaded successfully, but could not extract any text from these files.");
      } else {
        setMessage("Uploaded successfully — transcript ready to process.");
      }

      // This is what enables your Process button in Uploads.tsx (pendingText)
      onTextExtracted(transcript, uploaded);
    } catch (err) {
      console.error(err);
      setMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
      setIsDragOver(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    void handleFiles(e.target.files);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) void handleFiles(e.dataTransfer.files);
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
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          id="file-upload"
          type="file"
          accept={FILE_ACCEPT_ATTR}
          multiple
          onChange={onFileChange}
          className="hidden"
          onClick={(e) => e.stopPropagation()}
        />

        {!loading ? (
          <label
          htmlFor="file-upload"
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center gap-3 select-none"
        >
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm">
              <UploadIcon className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm md:text-base">Drag & drop your file(s) here</p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                or <span className="text-indigo-600 font-semibold">browse files</span>
              </p>
              <p className="mt-2 text-[11px] text-gray-400">Supported: PDF, DOCX, TXT, PNG, JPG/JPEG</p>
            </div>
          </label>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full max-w-sm">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm">
              <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm md:text-base">Uploading and extracting text…</p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">Images/DOCX can take a bit longer.</p>
            </div>
          </div>
        )}
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