"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui";

const noop = () => () => {};

export function CopyLink({ path }: { path: string }) {
  const origin = useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => "",
  );
  const [copied, setCopied] = useState(false);
  const url = origin + path;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <code className="bg-surface-2 truncate rounded-lg px-2 py-1 text-xs">{url}</code>
      <Button
        type="button"
        variant="ghost"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
