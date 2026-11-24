"use client";

import { BookOpen, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const NAV = [
  { href: "/today", label: "Today", Icon: BookOpen },
  { href: "/groups", label: "Groups", Icon: Users },
  { href: "/settings", label: "Settings", Icon: Settings },
];

const isActive = (path: string, href: string) => path === href || path.startsWith(href + "/");

function TopLinks({ path }: { path: string }) {
  return (
    <nav className="hidden gap-1 sm:flex" aria-label="Main">
      {NAV.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(path, href) ? "page" : undefined}
          className="text-muted hover:text-ink aria-[current=page]:bg-surface-2 aria-[current=page]:text-ink rounded-full px-3 py-1.5 text-sm font-medium"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function BottomLinks({ path }: { path: string }) {
  return (
    <nav aria-label="Main" className="border-line bg-bg fixed inset-x-0 bottom-0 z-20 border-t sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3">
        {NAV.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(path, href) ? "page" : undefined}
            className="text-muted aria-[current=page]:text-accent flex flex-col items-center gap-1 py-2.5 text-xs font-medium"
          >
            <Icon size={20} strokeWidth={2} aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function TopActive() {
  return <TopLinks path={usePathname()} />;
}
function BottomActive() {
  return <BottomLinks path={usePathname()} />;
}

// The current URL is only known at request time, so the active highlight streams in;
// the same links render without a highlight until then.
export function TopNav() {
  return (
    <Suspense fallback={<TopLinks path="" />}>
      <TopActive />
    </Suspense>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={<BottomLinks path="" />}>
      <BottomActive />
    </Suspense>
  );
}
