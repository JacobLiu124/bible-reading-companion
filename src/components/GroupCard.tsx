import { Globe, Lock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { denominationLabel } from "@/lib/denominations";

/** A group tile. A bounded box is right here: the whole tile is one link. */
export function GroupCard({
  group,
  members,
  role,
}: {
  group: { name: string; slug: string; description: string; visibility: string; denomination: string | null };
  members?: number;
  role?: string;
}) {
  const denom = denominationLabel(group.denomination);
  const Icon = group.visibility === "private" ? Lock : Globe;
  return (
    <Link
      href={`/groups/${group.slug}`}
      className="bg-surface-2 hover:bg-line block rounded-2xl p-4 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-bold">{group.name}</p>
        <Icon
          size={16}
          className="text-muted mt-0.5 shrink-0"
          aria-label={group.visibility === "private" ? "Private" : "Public"}
        />
      </div>
      {group.description && <p className="text-muted mt-1 line-clamp-2 text-sm">{group.description}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {denom && <Badge className="bg-surface">{denom}</Badge>}
        {members !== undefined && (
          <Badge className="bg-surface">
            {members} {members === 1 ? "member" : "members"}
          </Badge>
        )}
        {role && role !== "member" && (
          <Badge className="bg-accent-soft text-accent">
            {role === "joined" ? "Joined" : role === "owner" ? "Owner" : "Admin"}
          </Badge>
        )}
      </div>
    </Link>
  );
}
