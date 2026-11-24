import { BookOpen, Check, Globe, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import { LinkButton } from "@/components/ui";
import { DemoButton } from "./(auth)/auth-forms";

const features = [
  { Icon: BookOpen, title: "One chapter a day", text: "Everyone reads the same chapter, in their own Bible." },
  { Icon: Check, title: "Weekly streaks", text: "Set a goal like three days a week. Missing a day doesn't break the habit." },
  { Icon: Users, title: "Groups", text: "Share what stood out with your church or friends, in public or private groups." },
  { Icon: Globe, title: "The global thread", text: "One conversation a day about the chapter everyone read." },
];

const friends = [
  { name: "Ruth Miller", seed: "ruth_m" },
  { name: "Samuel Okafor", seed: "samuel_o" },
  { name: "Grace Lee", seed: "grace_lee" },
];

export default function Landing() {
  const demo = Boolean(process.env.DEMO_EMAIL && process.env.DEMO_PASSWORD);
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-16">
      <Logo className="text-xl" />

      <section className="mt-14">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1">
            {friends.map((f) => <Avatar key={f.seed} name={f.name} seed={f.seed} size={32} ring />)}
          </div>
          <p className="text-sm text-muted">Ruth, Samuel and Grace read today</p>
        </div>
        <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          Read the Bible every day, with your friends.
        </h1>
        <p className="mt-5 max-w-lg text-lg text-muted">
          OneJoy gives everyone the same chapter each day. Read it in your own Bible, check in, and talk about
          what stood out.
        </p>
        <div className="mt-8 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row">
          <LinkButton href="/sign-up" className="px-6 py-3 text-base">Get started</LinkButton>
          <LinkButton href="/sign-in" variant="secondary" className="px-6 py-3 text-base">Sign in</LinkButton>
          {demo && <DemoButton />}
        </div>
      </section>

      <ul className="mt-20 grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {features.map(({ Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <Icon size={22} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <div>
              <p className="font-bold">{title}</p>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-20 border-t border-line pt-6 text-sm text-muted">
        &ldquo;The joy of the LORD is your strength.&rdquo; Nehemiah 8:10
      </p>
    </main>
  );
}
