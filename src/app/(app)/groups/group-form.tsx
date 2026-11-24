"use client";

import { useActionState } from "react";
import { Button, Field, FormError, Input, Select, Textarea } from "@/components/ui";
import { DENOMINATIONS } from "@/lib/denominations";
import { DEFAULT_GROUP_RULES } from "@/lib/globalRules";
import { createGroupAction, updateGroupAction } from "./actions";

type Initial = { id: string; name: string; description: string; rules: string; denomination: string | null };

export function GroupForm({ initial, readOnly }: { initial?: Initial; readOnly?: boolean }) {
  const [state, action, pending] = useActionState(initial ? updateGroupAction : createGroupAction, undefined);
  return (
    <form action={action} className="space-y-4">
      {initial && <input type="hidden" name="groupId" value={initial.id} />}
      <Field label="Name">
        <Input name="name" defaultValue={initial?.name} minLength={3} maxLength={60} required />
      </Field>
      <Field label="Description" hint="What's this group about?">
        <Textarea name="description" defaultValue={initial?.description} maxLength={500} />
      </Field>
      <Field label="Denomination (optional)">
        <Select name="denomination" defaultValue={initial?.denomination ?? ""}>
          <option value="">None</option>
          {DENOMINATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </Select>
      </Field>
      <Field
        label="Group rules"
        hint={
          initial
            ? "Shown at the top of the group and above every reply box."
            : "Shown at the top of the group and above every reply box. Leave it empty to use the example."
        }
      >
        <Textarea
          name="rules"
          defaultValue={initial?.rules}
          placeholder={DEFAULT_GROUP_RULES}
          maxLength={2000}
        />
      </Field>
      {!initial && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Who can join?</legend>
          <label className="flex items-start gap-2 text-sm">
            <input type="radio" name="visibility" value="public" defaultChecked className="mt-1 accent-[var(--accent)]" />
            <span><strong>Public.</strong> Anyone can find it, read it and join.</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="radio" name="visibility" value="private" className="mt-1 accent-[var(--accent)]" />
            <span><strong>Private.</strong> Hidden from search. People join with an invite link, and only members can read it.</span>
          </label>
        </fieldset>
      )}
      <FormError message={state?.error} />
      {state?.ok && <p className="text-sm text-ok">Saved</p>}
      <Button disabled={pending || readOnly}>{pending ? "Saving…" : initial ? "Save changes" : "Create group"}</Button>
    </form>
  );
}
