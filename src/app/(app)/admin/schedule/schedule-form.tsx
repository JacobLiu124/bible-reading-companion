"use client";

import { useActionState } from "react";
import { Button, Field, FormError, Input, Select } from "@/components/ui";
import { BOOKS } from "@/lib/books";
import { setScheduleDayAction } from "./actions";

export function ScheduleForm({ defaultDay }: { defaultDay: string }) {
  const [state, action, pending] = useActionState(setScheduleDayAction, undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1.5fr_6rem_auto] sm:items-end">
      <Field label="Date"><Input type="date" name="day" defaultValue={defaultDay} required /></Field>
      <Field label="Book">
        <Select name="book" defaultValue="John" required>
          {BOOKS.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
        </Select>
      </Field>
      <Field label="Chapter"><Input type="number" name="chapter" min={1} max={150} defaultValue={1} required /></Field>
      <Button disabled={pending}>{pending ? "Saving…" : "Set"}</Button>
      <div className="sm:col-span-4">
        <FormError message={state?.error} />
        {state?.ok && <p className="text-sm text-ok">Saved</p>}
      </div>
    </form>
  );
}
