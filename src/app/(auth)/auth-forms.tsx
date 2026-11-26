"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, startTransition, useActionState, useState, useSyncExternalStore } from "react";
import { Button, Field, FormError, Input } from "@/components/ui";
import { MIN_PASSWORD_LENGTH, passwordStrength } from "@/lib/password";
import { signIn, signInDemo, signUp } from "./actions";

const noopSubscribe = () => () => {};

function NextInput() {
  const next = useSearchParams().get("next") ?? "";
  return <input type="hidden" name="next" value={next} />;
}

const CONFIRM_NOTICES: Record<string, string> = {
  "1": "Your email is confirmed. Sign in to start reading.",
  failed:
    "That confirmation link has expired or was already used. Try signing in, or sign up again for a new link.",
};

function ConfirmNotice() {
  const notice = CONFIRM_NOTICES[useSearchParams().get("confirmed") ?? ""];
  if (!notice) return null;
  return <p className="bg-accent-soft rounded-2xl p-4 text-sm">{notice}</p>;
}

/**
 * Submits through onSubmit rather than `action`: React 19 resets a form after an `action` runs, which
 * would wipe everything typed whenever the server says "that username is taken".
 */
function submitKeepingValues(action: (data: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-4">
      <ConfirmNotice />
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
  if (state?.checkEmail) return <CheckEmail email={state.checkEmail} />;
  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-4">
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
      <NewPasswordField />
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

const METER = {
  weak: { bars: 1, colour: "bg-danger", text: "text-danger" },
  fair: { bars: 2, colour: "bg-joy", text: "text-muted" },
  strong: { bars: 3, colour: "bg-done", text: "text-muted" },
} as const;

function NewPasswordField() {
  const [password, setPassword] = useState("");
  const strength = passwordStrength(password);
  const meter = strength && METER[strength.level];
  return (
    <div className="space-y-1.5">
      <label htmlFor="new-password" className="block text-sm font-semibold">
        Password
      </label>
      <Input
        id="new-password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-describedby="password-strength"
      />
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-colors ${meter && n <= meter.bars ? meter.colour : "bg-line"}`}
          />
        ))}
      </div>
      <p id="password-strength" aria-live="polite" className={`text-xs ${meter ? meter.text : "text-muted"}`}>
        {strength ? (
          <>
            <span className="sr-only">Password strength: </span>
            {strength.label}
          </>
        ) : (
          `At least ${MIN_PASSWORD_LENGTH} characters.`
        )}
      </p>
    </div>
  );
}

function CheckEmail({ email }: { email: string }) {
  return (
    <div role="status" className="space-y-4">
      <MailCheck size={32} className="text-accent" aria-hidden />
      <h2 className="text-xl font-bold">Check your email</h2>
      <p>
        We sent a link to <strong className="break-all">{email}</strong>. Open it to confirm your address and
        finish creating your account.
      </p>
      <p className="text-muted text-sm">
        It can take a few minutes, so check your spam folder too. Already confirmed?{" "}
        <Link className="text-accent underline" href="/sign-in">
          Sign in
        </Link>
      </p>
    </div>
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
