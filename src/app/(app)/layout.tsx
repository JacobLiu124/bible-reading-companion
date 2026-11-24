import { CalendarDays, Shield } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { BottomNav, TopNav } from "@/components/AppNav";
import { Logo } from "@/components/Logo";
import { NoticeBanner } from "@/components/NoticeBanner";
import { createClient } from "@/lib/supabase/server";
import { moderatesSomething } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

const toolLink = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink";

async function ExtraLinks() {
  const viewer = await getViewer();
  if (!viewer) return null;
  const mod = await moderatesSomething(viewer);
  return (
    <>
      {viewer.profile.is_demo && (
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">Demo, read-only</span>
      )}
      {mod && (
        <Link href="/moderation" className={toolLink}>
          <Shield size={16} aria-hidden />
          <span className="hidden md:inline">Moderation</span>
        </Link>
      )}
      {viewer.profile.is_site_admin && (
        <Link href="/admin/schedule" className={toolLink}>
          <CalendarDays size={16} aria-hidden />
          <span className="hidden md:inline">Schedule</span>
        </Link>
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
      <header className="sticky top-0 z-20 border-b border-line bg-bg">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Logo href="/today" className="mr-2 text-xl" />
          <TopNav />
          <div className="ml-auto flex items-center gap-1">
            <Suspense>
              <ExtraLinks />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-6 sm:pb-12">
        <Suspense>
          <div className="mb-4 empty:hidden">
            <Notices />
          </div>
        </Suspense>
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
