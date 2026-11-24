import Link from "next/link";

/** The OneJoy wordmark. Swap in an <Image> here once the logo artwork exists. */
export function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`font-serif font-semibold tracking-tight ${className}`}>
      OneJoy
    </Link>
  );
}
