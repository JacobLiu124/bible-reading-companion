"use client";

import { useActionState, useMemo, useSyncExternalStore } from "react";
import { Button, Field, FormError, Input, Select } from "@/components/ui";
import { DENOMINATIONS } from "@/lib/denominations";
import { deleteAccountAction, updateProfileAction } from "./actions";

const noopSubscribe = () => () => {};
let zoneCache: string[] | undefined;
const clientZones = () => (zoneCache ??= Intl.supportedValuesOf("timeZone"));
const NO_ZONES: string[] = [];
const serverZones = () => NO_ZONES;

type ProfileInit = { displayName: string; denomination: string | null; timezone: string; weeklyGoal: number };

export function ProfileForm({ initial, readOnly }: { initial: ProfileInit; readOnly: boolean }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);
  // The browser's zone list can differ from the server's, so read it on the client only.
  const all = useSyncExternalStore(noopSubscribe, clientZones, serverZones);
  const zones = useMemo(
    () => (all.includes(initial.timezone) ? all : [initial.timezone, ...all]),
    [all, initial.timezone],
  );
  return (
    <form action={action} className="space-y-4">
      <Field label="Your name">
        <Input name="displayName" defaultValue={initial.displayName} maxLength={40} required disabled={readOnly} />
      </Field>
      <Field label="Denomination (optional)">
        <Select name="denomination" defaultValue={initial.denomination ?? ""} disabled={readOnly}>
          <option value="">Prefer not to say</option>
          {DENOMINATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </Select>
      </Field>
      <Field label="Timezone" hint="Decides when your day (and week) starts.">
        <Select name="timezone" defaultValue={initial.timezone} disabled={readOnly}>
          {zones.map((z) => <option key={z} value={z}>{z.replaceAll("_", " ")}</option>)}
        </Select>
      </Field>
      <Field label="Weekly goal" hint="How many days a week you aim to read. Changes apply from this week.">
        <Select name="weeklyGoal" defaultValue={String(initial.weeklyGoal)} disabled={readOnly}>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <option key={n} value={n}>{n} {n === 1 ? "day" : "days"} a week</option>
          ))}
        </Select>
      </Field>
      <FormError message={state?.error} />
      {state?.ok && <p className="text-sm text-ok">Saved ✓</p>}
      <Button disabled={pending || readOnly}>{pending ? "Saving…" : "Save"}</Button>
    </form>
  );
}

export function DeleteAccountForm({ username, readOnly }: { username: string; readOnly: boolean }) {
  const [state, action, pending] = useActionState(deleteAccountAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <Field label={`Type ${username} to confirm`}>
        <Input name="confirm" autoComplete="off" autoCapitalize="none" disabled={readOnly} />
      </Field>
      <FormError message={state?.error} />
      <Button variant="danger" disabled={pending || readOnly}>{pending ? "Deleting…" : "Delete my account"}</Button>
    </form>
  );
}
