/**
 * Where a reflection is shared by default: the group this reader posts to most
 * (friends before the public thread), else their first group, else the global thread.
 */
export function defaultShareDestination(postedGroupIds: (string | null)[], myGroupIds: string[]): string {
  const counts = new Map<string, number>();
  for (const id of postedGroupIds) {
    if (id && myGroupIds.includes(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return top ?? myGroupIds[0] ?? "global";
}
