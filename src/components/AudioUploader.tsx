"use client";

import { useRef, useState } from "react";

import type { TranscriptItem } from "@/components/TranscriptList";

type AudioUploaderProps = {
  onTranscriptAdded: (transcript: TranscriptItem) => void;
};

const ACCEPTED_FILE_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
  "audio/m4a",
].join(",");
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function formatSize(sizeInBytes: number) {
  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }
  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AudioUploader({ onTranscriptAdded }: AudioUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [copied, setCopied] = useState(false);

  const resetForNewUpload = () => {
    setSelectedFile(null);
    setError(null);
    setTranscriptText("");
    setCopied(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFilePick = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setError(null);
      setTranscriptText("");
      setCopied(false);
      return;
    }

    if (!ACCEPTED_FILE_TYPES.split(",").includes(file.type)) {
      setSelectedFile(null);
      setTranscriptText("");
      setCopied(false);
      setError("Unsupported audio MIME type");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(file);
      setTranscriptText("");
      setCopied(false);
      setError("Audio file must be smaller than 10MB");
      return;
    }

    if (file.size === 0) {
      setSelectedFile(file);
      setTranscriptText("");
      setCopied(false);
      setError("Audio file is empty");
      return;
    }

    setSelectedFile(file);
    setError(null);
    setTranscriptText("");
    setCopied(false);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilePick(event.target.files?.[0] ?? null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFilePick(event.dataTransfer.files?.[0] ?? null);
  };

  const openFileDialog = () => {
    if (!isLoading) {
      inputRef.current?.click();
    }
  };

  const handleTranscribe = async () => {
    if (!selectedFile) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", selectedFile);
      formData.append("fileName", selectedFile.name);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        error?: string;
        transcript?: TranscriptItem;
      };

      if (response.status === 401) {
        throw new Error("Session expired, please sign in again");
      }

      if (!response.ok || !payload.transcript) {
        throw new Error(payload.error ?? "Transcription failed");
      }

      const addedTranscript = payload.transcript;
      setTranscriptText(addedTranscript.content);
      onTranscriptAdded(addedTranscript);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Transcription failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTranscript = async () => {
    await navigator.clipboard.writeText(transcriptText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={handleInputChange}
      />

      {!selectedFile && !transcriptText ? (
        <div
          role="button"
          tabIndex={0}
          onClick={openFileDialog}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFileDialog();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-xl border-[1.5px] border-dashed bg-white p-9 text-center transition-all duration-150 ease-in-out ${
            isDragging
              ? "border-[#6e89bb] shadow-[0_10px_25px_rgba(110,137,187,0.2)]"
              : "border-[#d5dce9]"
          }`}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto mb-3"
          >
            <path
              d="M12 16V4M12 4L7 9M12 4L17 9M5 16V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V16"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-[14px] text-[#5f6f88]">Drop audio here or click to browse</p>
        </div>
      ) : null}

      {selectedFile && !transcriptText ? (
        <div className="rounded-xl border border-[#d9e1ef] bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-medium text-[#1f2a44]">{selectedFile.name}</p>
              <p className="text-[13px] text-[#6b7b93]">{formatSize(selectedFile.size)}</p>
            </div>
            {!isLoading ? (
              <button
                type="button"
                onClick={resetForNewUpload}
                className="text-[18px] leading-none text-[#6b7280] transition-colors hover:text-[#2b3b59]"
                aria-label="Clear selected file"
              >
                ×
              </button>
            ) : null}
          </div>

          {!isLoading ? (
            <button
              type="button"
              onClick={() => void handleTranscribe()}
              disabled={isLoading || Boolean(error)}
              className="h-10 w-full rounded-lg bg-gradient-to-r from-[#5f7cb8] to-[#6e91cf] text-[14px] font-medium text-white shadow-[0_8px_18px_rgba(95,124,184,0.32)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Transcribe
            </button>
          ) : (
            <div>
              <div className="flex h-10 w-full items-center justify-center rounded-lg bg-[#5f7cb8] text-[14px] font-medium text-white">
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                Transcribing...
              </div>
              <div className="mt-3 h-3 w-full overflow-hidden rounded bg-[#edf1f8]">
                <div className="h-full w-1/2 animate-pulse rounded bg-[#d8e2f2]" />
              </div>
            </div>
          )}

          {error ? <p className="mt-2 text-[13px] text-[#dc2626]">{error}</p> : null}
        </div>
      ) : null}

      {transcriptText ? (
        <div className="rounded-xl border border-[#d9e1ef] bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
          <textarea
            readOnly
            value={transcriptText}
            rows={8}
            className="w-full resize-y rounded-lg border border-[#dce3ef] bg-[#fcfdff] p-3 text-[13px] text-[#334155] outline-none"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void handleCopyTranscript()}
              className="rounded-lg border border-[#cfd9ea] px-3 py-2 text-[13px] text-[#41536f] transition-colors hover:border-[#6e89bb] hover:text-[#2d405e]"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={resetForNewUpload}
              className="rounded-lg border border-[#cfd9ea] px-3 py-2 text-[13px] text-[#41536f] transition-colors hover:border-[#6e89bb] hover:text-[#2d405e]"
            >
              Upload another
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
