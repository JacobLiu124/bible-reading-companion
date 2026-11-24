import Link from "next/link";

export const metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 leading-relaxed">
      <Link href="/" className="text-sm text-accent">
        ← Back
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-semibold">Privacy note</h1>
      <div className="mt-6 space-y-4 text-muted">
        <p>OneJoy is a small, free project. You must be 13 or older to use it.</p>
        <p>
          <strong className="text-ink">What we store:</strong> your email, name, username, timezone,
          optional denomination, weekly goal, the days you checked in, and what you post.
        </p>
        <p>
          <strong className="text-ink">Passwords</strong> are handled by our sign-in provider
          (Supabase Auth) and are never stored by OneJoy itself.
        </p>
        <p>
          <strong className="text-ink">Who can see what:</strong> posts in private groups are visible
          only to members of that group. Posts in public groups and the global thread are visible to
          anyone signed in. Nothing is visible to people who aren&apos;t signed in.
        </p>
        <p>
          <strong className="text-ink">Deleting your account</strong> (in Settings) removes your
          profile, check-ins, posts and comments. Moderation records about rule-breaking are kept
          without your account attached.
        </p>
        <p>We don&apos;t sell data, show ads or use tracking cookies.</p>
      </div>
    </main>
  );
}
