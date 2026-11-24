"use client";

import { Globe } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { createGeneralPostAction, createReadingPostAction } from "@/app/(app)/actions";
import { Button, Field, FormError, Input, Textarea } from "@/components/ui";
import type { GroupOption } from "@/lib/types";

export function ReadingComposer({ groups, readOnly }: { groups: GroupOption[]; readOnly: boolean }) {
  const [state, action, pending] = useActionState(createReadingPostAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) formRef.current?.reset(); }, [state]);
  return (
    <form ref={formRef} action={action} className="space-y-4">
      <Field label="Your reflection" hint="Optional if you add a verse.">
        <Textarea name="body" maxLength={1000} placeholder="Something I noticed today…" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <Field label="Verse">
          <Input name="verseRef" maxLength={60} placeholder="Psalm 23:4" />
        </Field>
        <Field label="Verse text" hint="Type it from your Bible.">
          <Input name="verseText" maxLength={500} placeholder="Even though I walk…" />
        </Field>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Share to</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="toGlobal" defaultChecked className="accent-[var(--accent)]" />
          <Globe size={16} className="text-muted" aria-hidden /> Global thread
        </label>
        {groups.map((g) => (
          <label key={g.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="groupIds" value={g.id} className="accent-[var(--accent)]" />
            {g.name}
          </label>
        ))}
      </fieldset>
      <FormError message={state?.error} />
      {state?.ok && <p className="text-sm text-ok">Shared</p>}
      <Button disabled={pending || readOnly} title={readOnly ? "Demo is read-only" : undefined}>
        {pending ? "Sharing…" : "Share"}
      </Button>
    </form>
  );
}

export function GeneralComposer({ groupId, readOnly }: { groupId: string; readOnly: boolean }) {
  const [state, action, pending] = useActionState(createGeneralPostAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) formRef.current?.reset(); }, [state]);
  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="groupId" value={groupId} />
      <Input name="title" maxLength={120} placeholder="Title (optional)" />
      <Textarea name="body" maxLength={1000} placeholder="Share a prayer request, question or thought…" required />
      <FormError message={state?.error} />
      <Button disabled={pending || readOnly} title={readOnly ? "Demo is read-only" : undefined}>
        {pending ? "Posting…" : "Post"}
      </Button>
    </form>
  );
}
