"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useSyncExternalStore } from "react";
import { Button, Field, FormError, Input } from "@/components/ui";
import { signIn, signInDemo, signUp } from "./actions";

const noopSubscribe = () => () => {};

function NextInput() {
  const next = useSearchParams().get("next") ?? "";
  return <input type="hidden" name="next" value={next} />;
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <form action={action} className="space-y-4">
      <NextInput />
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <FormError message={state?.error} />
      <Button className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-muted text-center text-sm">
        New here?{" "}
        <Link className="text-accent underline" href="/sign-up">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, undefined);
  const tz = useSyncExternalStore(
    noopSubscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    () => "UTC",
  );
  return (
    <form action={action} className="space-y-4">
      <NextInput />
      <input type="hidden" name="timezone" value={tz} />
      <Field label="Your name" hint="Shown on your posts.">
        <Input name="displayName" maxLength={40} required />
      </Field>
      <Field label="Username" hint="3–24 letters, numbers or underscores.">
        <Input name="username" pattern="[A-Za-z0-9_]{3,24}" autoCapitalize="none" required />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="ageConfirmed" className="mt-1 accent-[var(--accent)]" required />
        <span>
          I&apos;m 13 or older and I&apos;ve read the{" "}
          <Link className="text-accent underline" href="/privacy">
            privacy note
          </Link>
          .
        </span>
      </label>
      <FormError message={state?.error} />
      <Button className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-muted text-center text-sm">
        Already have an account?{" "}
        <Link className="text-accent underline" href="/sign-in">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function DemoButton({ className }: { className?: string }) {
  const [state, action, pending] = useActionState(signInDemo, undefined);
  return (
    <form action={action} className={className}>
      <Button variant="secondary" className="w-full px-6 py-3 text-base" disabled={pending}>
        {pending ? "Opening demo…" : "Try the demo"}
      </Button>
      <FormError message={state?.error} />
    </form>
  );
}
