"use client";

import { useRef, useState } from "react";
import { FileCheck2, UploadCloud, X } from "lucide-react";
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

  const handleFiles = (files: FileList | null) => {
    const selected = files?.[0];
    if (!selected) return;

    if (!ACCEPTED_PROOF_MIME_TYPES.includes(selected.type)) {
      onChange(null);
      return;
    }
    if (selected.size > MAX_PROOF_SIZE_BYTES) {
      onChange(null);
      return;
    }
    onChange(selected);
  };

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
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragging ? "border-brand-400 bg-brand-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        }`}
      >
        {file ? (
          <>
            <FileCheck2 size={28} className="mb-2 text-success-600" />
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="mt-2 flex items-center gap-1 text-xs text-danger-600 hover:underline"
            >
              <X size={12} /> Remover
            </button>
          </>
        ) : (
          <>
            <UploadCloud size={28} className="mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">Arraste o comprovante aqui ou clique para enviar</p>
            <p className="mt-1 text-xs text-gray-400">JPG, PNG ou PDF · até 10 MB</p>
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
      {error && <p className="mt-1.5 text-xs text-danger-600">{error}</p>}
    </div>
  );
}
