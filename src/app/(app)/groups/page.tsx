import { Suspense } from "react";
import { GroupCard } from "@/components/GroupCard";
import { Button, Input, LinkButton, PageTitle, Select, Skeleton } from "@/components/ui";
import { DENOMINATIONS } from "@/lib/denominations";
import { getMyGroups, requireViewer } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Groups" };

type Search = Promise<{ q?: string; denomination?: string }>;

export default function GroupsPage({ searchParams }: { searchParams: Search }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <PageTitle sub="Read and talk with your church or friends.">Groups</PageTitle>
        <LinkButton href="/groups/new">New group</LinkButton>
      </div>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <GroupLists searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function GroupLists({ searchParams }: { searchParams: Search }) {
  const viewer = await requireViewer();
  const { q = "", denomination = "" } = await searchParams;
  const supabase = await createClient();

  let discover = supabase
    .from("groups")
    .select("id, name, slug, description, visibility, denomination, group_members(count)")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(50);
  if (q.trim()) discover = discover.ilike("name", `%${q.trim().replace(/[%_]/g, "")}%`);
  if (denomination) discover = discover.eq("denomination", denomination);

  const [mine, found] = await Promise.all([getMyGroups(viewer.id), discover]);
  const mineIds = new Set(mine.map((g) => g.id));
  const { data: mineFull } = mine.length
    ? await supabase.from("groups").select("id, name, slug, description, visibility, denomination").in("id", [...mineIds])
    : { data: [] };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 font-serif text-xl font-semibold">My groups</h2>
        {mine.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">
            You&apos;re not in any groups yet. Join one below or create your own.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {(mineFull ?? []).map((g) => (
              <GroupCard key={g.id} group={g} role={mine.find((m) => m.id === g.id)?.role} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-serif text-xl font-semibold">Discover public groups</h2>
        <form className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Input name="q" defaultValue={q} placeholder="Search by name" className="sm:flex-1" />
          <Select name="denomination" defaultValue={denomination} className="sm:w-60">
            <option value="">All denominations</option>
            {DENOMINATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </Select>
          <Button variant="secondary">Search</Button>
        </form>
        {(found.data ?? []).length === 0 ? (
          <p className="text-muted">No public groups match.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {(found.data ?? []).map((g) => (
              <GroupCard key={g.id} group={g} members={g.group_members?.[0]?.count ?? 0} role={mineIds.has(g.id) ? "joined" : undefined} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
