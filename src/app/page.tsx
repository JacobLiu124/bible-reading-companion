import { LinkButton } from "@/components/ui";
import { DemoButton } from "./(auth)/auth-forms";

const features = [
  { icon: "📖", title: "One chapter a day", text: "Everyone reads the same chapter, in their own Bible." },
  { icon: "🔥", title: "Weekly streaks", text: "Set a goal like 3 days a week. Miss a day, not the habit." },
  { icon: "👥", title: "Groups", text: "Share what stood out with your church or friends, public or private." },
  { icon: "🌍", title: "The global thread", text: "One conversation a day about the chapter everyone read." },
];

export default function Landing() {
  const demo = Boolean(process.env.DEMO_EMAIL && process.env.DEMO_PASSWORD);
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <p className="font-serif text-xl">🪔 Lamp</p>
      <h1 className="mt-10 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        Read the Bible every day,
        <br />
        together.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        Lamp tells you today&apos;s chapter. Read it in your own Bible, check in, and talk about what
        stood out with your friends.
      </p>
      <div className="mt-8 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row">
        <LinkButton href="/sign-up" className="px-6 py-3">
          Get started
        </LinkButton>
        <LinkButton href="/sign-in" variant="secondary" className="px-6 py-3">
          Sign in
        </LinkButton>
        {demo && <DemoButton />}
      </div>
      <ul className="mt-16 grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <li key={f.title} className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-2xl">{f.icon}</p>
            <p className="mt-2 font-medium">{f.title}</p>
            <p className="text-sm text-muted">{f.text}</p>
          </li>
        ))}
      </ul>
      <p className="mt-16 text-center text-sm italic text-muted">
        &ldquo;Thy word is a lamp unto my feet, and a light unto my path.&rdquo; — Psalm 119:105 (KJV)
      </p>
    </main>
  );
}
