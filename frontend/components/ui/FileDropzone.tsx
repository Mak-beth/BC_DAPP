"use client";
import { useRef, useState, type DragEvent } from "react";
import { UploadCloud, FileCheck } from "lucide-react";
import { cn } from "@/lib/cn";

interface FileDropzoneProps {
  accept?: string;
  file: File | null;
  onFile: (file: File | null) => void;
  hint?: string;
}

export function FileDropzone({ accept, file, onFile, hint }: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "cursor-pointer rounded-lg border-2 border-dashed p-5 text-center transition-all",
        "border-border-subtle bg-white/[0.02] hover:bg-white/[0.04] hover:border-indigo-400/60",
        dragging && "border-indigo-400 bg-indigo-500/10"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <div className="flex items-center justify-center gap-2 text-sm text-emerald-300">
          <FileCheck className="w-5 h-5" />
          <span className="font-medium">{file.name}</span>
          <span className="text-gray-500 text-xs">· click to replace</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <UploadCloud className="w-6 h-6" />
          <span className="text-sm">Drop a file here or click to browse</span>
          {hint && <span className="text-xs text-gray-500">{hint}</span>}
        </div>
      )}
    </div>
  );
}
