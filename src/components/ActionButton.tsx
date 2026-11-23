"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";

type Variant = "primary" | "secondary" | "ghost" | "danger";

/** A button that runs a Server Action, with optional confirm and inline error. */
export function ActionButton({
  action, children, confirm, variant = "secondary", disabled, className,
}: {
  action: () => Promise<{ error?: string } | undefined>;
  children: React.ReactNode;
  confirm?: string;
  variant?: Variant;
  disabled?: boolean;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={variant}
        className={className}
        disabled={pending || disabled}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => setError((await action())?.error));
        }}
      >
        {pending ? "…" : children}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </span>
  );
}
