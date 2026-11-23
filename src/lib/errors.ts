const MESSAGES = {
  not_checked_in: "Check in for today's reading first.",
  not_today: "You can only post about today's reading.",
  no_reading_today: "There's no reading scheduled for today.",
  muted: "You've been muted here for now.",
  banned: "You've been banned from this space.",
  slow_mode: "You're new here, so posting is limited for your first 48 hours. Try again in a little while.",
  demo_read_only: "The demo is read-only. Sign up to join in!",
  global_reading_only: "The global thread is only for reflections on today's reading.",
  not_member: "Join this group first.",
  forbidden: "You don't have permission to do that.",
  owner_must_transfer: "Hand ownership to another member before leaving.",
  invalid_invite: "This invite link has expired or been revoked.",
  no_destination: "Choose at least one group or the global thread.",
  invalid_duration: "Mutes last 1 or 7 days.",
  invalid_goal: "Pick a weekly goal between 1 and 7.",
} as const;

export type ErrorCode = keyof typeof MESSAGES;
export const ERROR_CODES = Object.keys(MESSAGES) as ErrorCode[];
const GENERIC = "Something went wrong. Please try again.";

/** Maps a Supabase/Postgres error (raised as `raise exception '<code>'`) to friendly copy. */
export function friendlyError(error: unknown): string {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : "";
  const code = message.trim() as ErrorCode;
  return MESSAGES[code] ?? GENERIC;
}
