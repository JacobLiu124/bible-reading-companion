"use client";

import { useTransition } from "react";
import { acknowledgeNoticeAction } from "@/app/(app)/actions";
import { Button } from "@/components/ui";

export function NoticeBanner({ notices }: { notices: { id: string; message: string }[] }) {
  const [pending, start] = useTransition();
  if (!notices.length) return null;
  return (
    <div className="space-y-2">
      {notices.map((n) => (
        <div key={n.id} role="alert" className="flex flex-col gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">⚠️ {n.message}</p>
          <Button variant="secondary" disabled={pending} onClick={() => start(async () => { await acknowledgeNoticeAction(n.id); })}>
            I understand
          </Button>
        </div>
      ))}
    </div>
  );
}
