# Phase 04 — Inputs & Form primitives

## Goal
Replace plain `<input>` / `<textarea>` / `<select>` / file-pickers with themed, reusable primitives that all share the same focus glow, error state, and sizing. Forms on `/add-product`, `/verify`, and the wallet register modal become visually coherent.

## Files in scope (ALLOWED to create/edit)
- `frontend/components/ui/Input.tsx` (new)
- `frontend/components/ui/Textarea.tsx` (new)
- `frontend/components/ui/Select.tsx` (new)
- `frontend/components/ui/FileDropzone.tsx` (new)
- `frontend/components/ui/Label.tsx` (new)
- `frontend/app/add-product/page.tsx`
- `frontend/app/verify/page.tsx`
- `frontend/components/WalletConnect.tsx`

## Files OUT of scope
- Anything else.

## Dependencies
None new.

## Implementation steps

### 1. `frontend/components/ui/Label.tsx`
```tsx
import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Label({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-sm font-medium text-gray-300 mb-1.5", className)} {...rest} />;
}
```

### 2. `frontend/components/ui/Input.tsx`
```tsx
"use client";
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, mono, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full h-10 px-3 rounded-lg bg-white/[0.04] text-gray-100 placeholder-gray-500",
        "border transition-all",
        "border-border-subtle",
        "focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 focus:bg-white/[0.06]",
        error && "border-rose-500/60 focus:border-rose-400 focus:ring-rose-400/30",
        mono && "font-mono",
        className
      )}
      {...rest}
    />
  );
});
```

### 3. `frontend/components/ui/Textarea.tsx`
```tsx
"use client";
import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-[100px] px-3 py-2 rounded-lg bg-white/[0.04] text-gray-100 placeholder-gray-500",
          "border border-border-subtle transition-all",
          "focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 focus:bg-white/[0.06]",
          className
        )}
        {...rest}
      />
    );
  }
);
```

### 4. `frontend/components/ui/Select.tsx`
```tsx
"use client";
import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full h-10 px-3 rounded-lg bg-white/[0.04] text-gray-100",
          "border border-border-subtle transition-all",
          "focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30",
          className
        )}
        {...rest}
      >
        {children}
      </select>
    );
  }
);
```

### 5. `frontend/components/ui/FileDropzone.tsx`
```tsx
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
```

### 6. Refactor forms to use primitives

**`frontend/app/add-product/page.tsx`** — replace every `<input className="bg-gray-700 ...">` with `<Input>`, every `<textarea>` with `<Textarea>`, every `<label>` with `<Label>`. Replace the file input block with `<FileDropzone accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" file={certFile} onFile={setCertFile} hint="PDF or image of certification" />`.

**`frontend/app/verify/page.tsx`** — replace the product-ID `<input>` with `<Input type="number" min="1" ...>`.

**`frontend/components/WalletConnect.tsx`** — inside the register modal, replace the company-name `<input>` with `<Input>` and the role `<select>` with `<Select>`.

## Acceptance checks
- [ ] Every form field has the same indigo focus glow.
- [ ] The Add Product certification field is a dashed drop-zone with an upload icon; drag-dropping a file populates it.
- [ ] Clicking the drop-zone opens the file picker.
- [ ] Existing form behaviour is unchanged (required fields, submit flow all work).
- [ ] `npm run build` is clean.

## STOP — request user review
After finishing, post exactly: `Phase 04 complete — requesting review.`
