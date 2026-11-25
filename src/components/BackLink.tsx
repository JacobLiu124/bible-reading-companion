import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-accent -ml-1 inline-flex min-h-11 items-center gap-0.5 text-sm font-medium hover:underline"
    >
      <ChevronLeft size={16} aria-hidden />
      {children}
    </Link>
  );
}
