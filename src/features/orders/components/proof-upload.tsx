"use client";

import { useRef, useState } from "react";
import { FileCheck2, Paperclip, X } from "lucide-react";
import { ACCEPTED_PROOF_MIME_TYPES, MAX_PROOF_SIZE_BYTES } from "@/lib/validation/schemas";

export function ProofUpload({
  file,
  onChange,
  error,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    const selected = files?.[0];
    if (!selected) return;

    if (!ACCEPTED_PROOF_MIME_TYPES.includes(selected.type)) {
      setLocalError("Formato não aceito. Envie uma imagem (JPG/PNG) ou um PDF.");
      onChange(null);
      return;
    }
    if (selected.size > MAX_PROOF_SIZE_BYTES) {
      setLocalError("Arquivo muito grande. O limite é 10 MB.");
      onChange(null);
      return;
    }
    setLocalError(null);
    onChange(selected);
  };

  const shownError = localError ?? error;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragging ? "border-brand-400 bg-brand-50" : shownError ? "border-danger-300 bg-danger-50" : "border-gray-300 bg-gray-50"
        }`}
      >
        {file ? (
          <>
            <FileCheck2 size={28} className="mb-2 text-success-600" />
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setLocalError(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="mt-3 flex items-center gap-1 text-xs font-medium text-danger-600 hover:underline"
            >
              <X size={12} /> Remover e escolher outro
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-gray-600">Arraste o comprovante aqui, ou:</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="btn-primary"
            >
              <Paperclip size={16} /> Escolher arquivo
            </button>
            <p className="mt-3 text-xs text-gray-400">JPG, PNG ou PDF · até 10 MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {shownError && <p className="mt-1.5 text-xs font-medium text-danger-600">{shownError}</p>}
    </div>
  );
}
