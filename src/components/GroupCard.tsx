import Link from "next/link";
import { Badge } from "@/components/ui";
import { denominationLabel } from "@/lib/denominations";

export function GroupCard({
  group, members, role,
}: {
  group: { name: string; slug: string; description: string; visibility: string; denomination: string | null };
  members?: number;
  role?: string;
}) {
  const denom = denominationLabel(group.denomination);
  return (
    <Link href={`/groups/${group.slug}`} className="block rounded-2xl border border-line bg-surface p-4 transition hover:border-accent/50">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">{group.name}</p>
        <span className="text-xs text-muted">{group.visibility === "private" ? "🔒 Private" : "🌐 Public"}</span>
      </div>
      {group.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{group.description}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {denom && <Badge>{denom}</Badge>}
        {members !== undefined && <Badge>{members} {members === 1 ? "member" : "members"}</Badge>}
        {role && role !== "member" && <Badge className="bg-accent-soft text-accent">{role}</Badge>}
      </div>
    </Link>
  );
}
