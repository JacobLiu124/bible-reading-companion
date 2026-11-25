import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:brightness-110",
  secondary: "bg-surface-2 text-ink hover:bg-line",
  ghost: "text-muted hover:text-ink hover:bg-surface-2",
  danger: "bg-surface-2 text-danger hover:bg-line",
};
const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  className,
  ...p
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(base, variants[variant], className)} {...p} />;
}

export function LinkButton({
  variant = "primary",
  className,
  ...p
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(base, variants[variant], className)} {...p} />;
}

/** A quiet tinted panel for forms and grouped settings. Feeds and lists don't use it. */
export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div className={cx("bg-surface-2 rounded-2xl p-5", className)} {...p} />;
}

const field =
  "w-full rounded-xl border border-line bg-surface px-3 py-2 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none";

export function Input({ className, ...p }: ComponentProps<"input">) {
  return <input className={cx(field, className)} {...p} />;
}
export function Textarea({ className, ...p }: ComponentProps<"textarea">) {
  return <textarea className={cx(field, "min-h-24", className)} {...p} />;
}
export function Select({ className, ...p }: ComponentProps<"select">) {
  return <select className={cx(field, className)} {...p} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="text-muted block text-xs">{hint}</span>}
    </label>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-danger text-sm font-medium">
      {message}
    </p>
  );
}

export function Badge({ className, ...p }: ComponentProps<"span">) {
  return (
    <span
      className={cx(
        "bg-surface-2 text-muted inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      {...p}
    />
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight">{children}</h1>
      {sub && <p className="text-muted mt-1">{sub}</p>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-lg font-bold">{children}</h2>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("bg-surface-2 animate-pulse rounded-2xl", className)} />;
}

export { cx };
