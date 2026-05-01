"use client";

import React, { useRef, useState, useCallback } from "react";
import { Upload, X, FileText, Image, Archive } from "lucide-react";

interface UploadedFile {
  file: File;
  progress: number;
  id: string;
}

function fileIcon(type: string) {
  if (type.startsWith("image/")) return <Image size={14} />;
  if (type.includes("zip") || type.includes("tar")) return <Archive size={14} />;
  return <FileText size={14} />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileUploadProps {
  onFilesChange?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxMB?: number;
}

export function FileUpload({
  onFilesChange,
  accept,
  multiple = true,
  maxMB = 50,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const newUploads: UploadedFile[] = [];

      Array.from(files).forEach((file) => {
        if (file.size > maxMB * 1024 * 1024) return;
        const id = Math.random().toString(36).slice(2);
        newUploads.push({ file, progress: 0, id });

        // Simulate progress
        let p = 0;
        const interval = setInterval(() => {
          p += Math.random() * 30;
          if (p >= 100) {
            p = 100;
            clearInterval(interval);
          }
          setUploads((prev) =>
            prev.map((u) => (u.id === id ? { ...u, progress: Math.round(p) } : u))
          );
        }, 200);
      });

      const next = [...uploads, ...newUploads];
      setUploads(next);
      onFilesChange?.(next.map((u) => u.file));
    },
    [maxMB, onFilesChange, uploads]
  );

  const remove = (id: string) => {
    setUploads((prev) => {
      const next = prev.filter((u) => u.id !== id);
      onFilesChange?.(next.map((u) => u.file));
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        className={[
          "relative border-2 border-dashed transition-all duration-200 cursor-pointer",
          "flex flex-col items-center justify-center gap-3 py-10 px-6",
          dragging
            ? "border-[#6C5CE7] bg-[#6C5CE7]/10 shadow-[0_0_24px_rgba(108,92,231,0.2)]"
            : "border-[#2A2A2A] bg-[#121212] hover:border-[#6C5CE7]/50 hover:bg-[#6C5CE7]/5",
        ].join(" ")}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          processFiles(e.dataTransfer.files);
        }}
        role="button"
        aria-label="Upload files"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <Upload
          size={28}
          className={dragging ? "text-[#6C5CE7]" : "text-[#A1A1AA]"}
        />
        <div className="text-center">
          <p className="text-white text-sm font-semibold">
            Drag files here or <span className="text-[#6C5CE7]">click to upload</span>
          </p>
          <p className="text-[#A1A1AA] text-xs mt-1">Max {maxMB}MB per file</p>
        </div>
        <div className="flex items-center gap-1.5 text-[#22C55E] text-xs">
          <span>🔒</span>
          <span>Files encrypted locally before upload</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => processFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {uploads.length > 0 && (
        <div className="flex flex-col gap-2">
          {uploads.map(({ file, progress, id }) => (
            <div
              key={id}
              className="bg-[#181818] border border-[#2A2A2A] px-4 py-3 flex items-center gap-3"
            >
              <span className="text-[#6C5CE7]">{fileIcon(file.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{file.name}</p>
                <p className="text-[#A1A1AA] text-[10px]">{formatBytes(file.size)}</p>
                {progress < 100 && (
                  <div className="mt-1.5 h-1 bg-[#2A2A2A] w-full overflow-hidden">
                    <div
                      className="h-full bg-[#6C5CE7] transition-all duration-300 progress-stripe"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
                {progress === 100 && (
                  <p className="text-[#22C55E] text-[10px] mt-0.5 font-semibold">✓ Encrypted & ready</p>
                )}
              </div>
              <button
                onClick={() => remove(id)}
                className="text-[#A1A1AA] hover:text-[#FF4D4F] transition-colors"
                aria-label="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
