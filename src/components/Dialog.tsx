"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

/** Native <dialog> modal. Controlled by `open`. */
export function Dialog({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/40"
    >
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Close"><X size={18} aria-hidden /></button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
