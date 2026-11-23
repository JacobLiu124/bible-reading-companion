import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-8 text-center font-serif text-2xl font-semibold">
        🪔 Lamp
      </Link>
      {children}
    </main>
  );
}
