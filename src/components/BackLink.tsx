import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="-ml-1 inline-flex items-center gap-0.5 text-sm font-medium text-accent hover:underline">
      <ChevronLeft size={16} aria-hidden />
      {children}
    </Link>
  );
}
