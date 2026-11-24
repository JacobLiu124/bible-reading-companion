const TINTS = [
  "bg-[#dce6fd] text-[#1e3fb0] dark:bg-[#1e2a4f] dark:text-[#b9c8ff]",
  "bg-[#fff1c7] text-[#7a5400] dark:bg-[#3a2f10] dark:text-[#ffd977]",
  "bg-[#e3f3ea] text-[#1f6b43] dark:bg-[#15352a] dark:text-[#9fdcbc]",
  "bg-[#fbe4ec] text-[#8c2650] dark:bg-[#3d1a29] dark:text-[#f4a9c4]",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

function tintFor(key: string): string {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

/** Initials avatar. The tint is stable per person so friends are recognisable at a glance. */
export function Avatar({
  name,
  seed,
  size = 36,
  ring = false,
}: {
  name: string;
  seed: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${tintFor(seed)} ${ring ? "ring-bg ring-2" : ""}`}
    >
      {initials(name)}
    </span>
  );
}
