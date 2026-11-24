import Link from "next/link";
import { Avatar } from "@/components/Avatar";

type Friend = { user_id: string; username: string; display_name: string };

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** "Ruth, Samuel and 4 others read today" with stacked avatars. */
export function FriendsRow({ friends, inAnyGroup }: { friends: Friend[]; inAnyGroup: boolean }) {
  if (!inAnyGroup) {
    return (
      <p className="text-sm text-muted">
        <Link href="/groups" className="font-semibold text-accent hover:underline">Join a group</Link> to see when friends read.
      </p>
    );
  }
  if (friends.length === 0) {
    return <p className="text-sm text-muted">No one in your groups has read yet today.</p>;
  }
  const names = friends.slice(0, 2).map((f) => firstName(f.display_name));
  const others = friends.length - names.length;
  const text =
    others > 0
      ? `${names.join(", ")} and ${others} ${others === 1 ? "other" : "others"} read today`
      : `${names.join(" and ")} read today`;
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-1">
        {friends.slice(0, 3).map((f) => (
          <Avatar key={f.user_id} name={f.display_name} seed={f.username} size={30} ring />
        ))}
      </div>
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}
