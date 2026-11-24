"use client";

import { useActionState, useEffect, useRef } from "react";
import { createGeneralPostAction, createReadingPostAction } from "@/app/(app)/actions";
import { Button, Field, FormError, Input, Select, Textarea } from "@/components/ui";
import type { GroupOption } from "@/lib/types";

export function ReadingComposer({ groups, readOnly }: { groups: GroupOption[]; readOnly: boolean }) {
  const [state, action, pending] = useActionState(createReadingPostAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) formRef.current?.reset(); }, [state]);
  return (
    <form ref={formRef} action={action} className="space-y-4">
      <Field label="Your reflection" hint="Optional if you add a scripture.">
        <Textarea name="body" maxLength={1000} placeholder="Something I noticed today…" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <Field label="Scripture">
          <Input name="verseRef" maxLength={60} placeholder="Psalm 23:4" />
        </Field>
        <Field label="Scripture text" hint="Type it from your Bible.">
          <Input name="verseText" maxLength={500} placeholder="Even though I walk…" />
        </Field>
      </div>
      <Field label="Share to" hint={groups.length ? "Share again to post it somewhere else too." : undefined}>
        <Select name="destination" defaultValue="global">
          <option value="global">Global thread</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
      </Field>
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
