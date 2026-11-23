import type { Database } from "@/lib/database.types";

type Views = Database["public"]["Views"];
type Tables = Database["public"]["Tables"];

export type FeedPost = Views["feed_posts"]["Row"];
export type FeedComment = Views["feed_comments"]["Row"];
export type Group = Tables["groups"]["Row"];
export type GroupMember = Tables["group_members"]["Row"];
export type Notice = Tables["notices"]["Row"];
export type Report = Tables["reports"]["Row"];
export type ModerationAction = Tables["moderation_actions"]["Row"];

export type GroupOption = { id: string; name: string };
