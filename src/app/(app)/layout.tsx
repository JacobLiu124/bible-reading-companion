import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { NoticeBanner } from "@/components/NoticeBanner";
import { createClient } from "@/lib/supabase/server";
import { moderatesSomething } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

const NAV = [
  { href: "/today", label: "Today", icon: "📖" },
  { href: "/groups", label: "Groups", icon: "👥" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

async function ExtraLinks() {
  const viewer = await getViewer();
  if (!viewer) return null;
  const mod = await moderatesSomething(viewer);
  return (
    <>
      {viewer.profile.is_demo && (
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs text-accent">Demo · read-only</span>
      )}
      {mod && <Link href="/moderation" className="rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink">🛡️ Moderation</Link>}
      {viewer.profile.is_site_admin && (
        <Link href="/admin/schedule" className="rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink">🗓️ Schedule</Link>
      )}
    </>
  );
}

async function Notices() {
  const viewer = await getViewer();
  if (!viewer) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("notices")
    .select("id, message")
    .is("acknowledged_at", null)
    .order("created_at");
  return <NoticeBanner notices={data ?? []} />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <Logo href="/today" className="mr-2 text-xl" />
          <nav className="hidden gap-1 sm:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Suspense>
              <ExtraLinks />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-6 sm:pb-12">
        <Suspense>
          <div className="mb-4 empty:hidden">
            <Notices />
          </div>
        </Suspense>
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="flex flex-col items-center gap-0.5 py-2.5 text-xs text-muted">
              <span className="text-lg" aria-hidden>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
