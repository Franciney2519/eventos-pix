"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export function QrScanner({ onDecode, onClose }: { onDecode: (text: string) => void; onClose: () => void }) {
  const containerId = "qr-reader";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const decodedRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId, { verbose: false });
    scannerRef.current = scanner;
    decodedRef.current = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (decodedRef.current) return;
          decodedRef.current = true;
          onDecode(decodedText);
        },
        undefined
      )
      .catch(() => {
        // camera unavailable / permission denied — surfaced visually by the empty preview
      });

    return () => {
      scanner.stop().then(() => scanner.clear()).catch(() => undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div id={containerId} className="overflow-hidden rounded-2xl border border-gray-200" />
      <button className="btn-secondary w-full" onClick={onClose}>
        Fechar câmera
      </button>
    </div>
  );
}
