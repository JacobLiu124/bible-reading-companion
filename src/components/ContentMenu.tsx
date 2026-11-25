"use client";

import { Ellipsis } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import {
  blockUserAction,
  deleteCommentAction,
  deletePostAction,
  editCommentAction,
  editPostAction,
  reportAction,
} from "@/app/(app)/actions";
import { moderateUserAction, removeCommentAction, removePostAction } from "@/app/(app)/moderation/actions";
import { Dialog } from "@/components/Dialog";
import { Button, Field, FormError, Input, Select, Textarea } from "@/components/ui";

export type MenuTarget = {
  type: "post" | "comment";
  id: string;
  authorId: string;
  authorName: string;
  groupId: string | null;
  kind?: string;
  title?: string | null;
  body?: string | null;
  verseRef?: string | null;
  verseText?: string | null;
};

type Mode = null | "edit" | "report" | "moderate";

export function ContentMenu({
  target,
  isAuthor,
  canModerate,
  readOnly,
  removed,
}: {
  target: MenuTarget;
  isAuthor: boolean;
  canModerate: boolean;
  readOnly: boolean;
  removed: boolean;
}) {
  const [mode, setMode] = useState<Mode>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  if (readOnly) return null;

  const run = (fn: () => Promise<{ error?: string } | undefined>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    start(async () => setError((await fn())?.error));
  };
  const close = () => setMode(null);

  const items: { label: string; onClick: () => void; danger?: boolean }[] = [];
  if (isAuthor && !removed) items.push({ label: "Edit", onClick: () => setMode("edit") });
  if (isAuthor)
    items.push({
      label: "Delete",
      danger: true,
      onClick: () =>
        run(
          () => (target.type === "post" ? deletePostAction(target.id) : deleteCommentAction(target.id)),
          `Delete this ${target.type}? This can't be undone.`,
        ),
    });
  if (!isAuthor) {
    items.push({ label: "Report", onClick: () => setMode("report") });
    items.push({
      label: `Block ${target.authorName}`,
      onClick: () =>
        run(
          () => blockUserAction(target.authorId),
          `Block ${target.authorName}? You won't see their posts or comments anywhere.`,
        ),
    });
  }
  if (canModerate && !isAuthor) {
    if (!removed)
      items.push({
        label: `Remove ${target.type}`,
        danger: true,
        onClick: () =>
          run(
            () => (target.type === "post" ? removePostAction(target.id) : removeCommentAction(target.id)),
            `Remove this ${target.type}? Members will see "Removed by a moderator".`,
          ),
      });
    items.push({ label: "Warn / mute / ban author", onClick: () => setMode("moderate") });
  }

  return (
    <>
      <details className="relative [&_summary::-webkit-details-marker]:hidden">
        <summary
          className="text-muted hover:bg-surface-2 hover:text-ink relative flex cursor-pointer list-none items-center rounded-full p-1.5 after:absolute after:-inset-[7px] after:content-['']"
          aria-label="More actions"
        >
          <Ellipsis size={18} aria-hidden />
        </summary>
        <ul className="border-line bg-surface absolute right-0 z-10 mt-1 w-56 overflow-hidden rounded-xl border py-1 shadow-lg">
          {items.map((it) => (
            <li key={it.label}>
              <button
                type="button"
                disabled={pending}
                onClick={(e) => {
                  (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
                  it.onClick();
                }}
                className={`hover:bg-surface-2 block w-full px-4 py-2 text-left text-sm ${it.danger ? "text-danger" : ""}`}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      </details>
      {error && <span className="text-danger text-xs">{error}</span>}
      {mode === "edit" && <EditDialog target={target} onClose={close} />}
      {mode === "report" && <ReportDialog target={target} onClose={close} />}
      {mode === "moderate" && <ModerateDialog target={target} onClose={close} />}
    </>
  );
}

function useCloseOnOk(state: { ok?: boolean } | undefined, onClose: () => void) {
  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);
}

function EditDialog({ target, onClose }: { target: MenuTarget; onClose: () => void }) {
  const [state, action, pending] = useActionState(
    target.type === "post" ? editPostAction : editCommentAction,
    undefined,
  );
  useCloseOnOk(state, onClose);
  return (
    <Dialog open onClose={onClose} title={`Edit ${target.type}`}>
      <form action={action} className="space-y-3">
        <input type="hidden" name="id" value={target.id} />
        <input type="hidden" name="kind" value={target.kind ?? ""} />
        {target.kind === "general" && (
          <Input
            name="title"
            defaultValue={target.title ?? ""}
            maxLength={120}
            placeholder="Title (optional)"
          />
        )}
        <Textarea name="body" defaultValue={target.body ?? ""} maxLength={1000} />
        {target.type === "post" && target.kind === "reading" && (
          <>
            <Input
              name="verseRef"
              defaultValue={target.verseRef ?? ""}
              maxLength={60}
              placeholder="Scripture (Psalm 23:4)"
            />
            <Input
              name="verseText"
              defaultValue={target.verseText ?? ""}
              maxLength={500}
              placeholder="Scripture text"
            />
          </>
        )}
        <FormError message={state?.error} />
        <Button disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </form>
    </Dialog>
  );
}

function ReportDialog({ target, onClose }: { target: MenuTarget; onClose: () => void }) {
  const [state, action, pending] = useActionState(reportAction, undefined);
  if (state?.ok) {
    return (
      <Dialog open onClose={onClose} title="Thanks for reporting">
        <p className="text-muted">The moderators of this space will take a look.</p>
      </Dialog>
    );
  }
  return (
    <Dialog open onClose={onClose} title={`Report ${target.type}`}>
      <form action={action} className="space-y-3">
        <input type="hidden" name={target.type === "post" ? "postId" : "commentId"} value={target.id} />
        <Field label="Reason">
          <Select name="reason" required defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            <option value="spam">Spam</option>
            <option value="harassment">Harassment or bullying</option>
            <option value="inappropriate">Inappropriate content</option>
            <option value="other">Something else</option>
          </Select>
        </Field>
        <Field label="Anything else? (optional)">
          <Textarea name="note" maxLength={500} />
        </Field>
        <FormError message={state?.error} />
        <Button disabled={pending}>{pending ? "Sending…" : "Send report"}</Button>
      </form>
    </Dialog>
  );
}

export function ModerateDialog({
  target,
  onClose,
}: {
  target: Pick<MenuTarget, "authorId" | "authorName" | "groupId">;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(moderateUserAction, undefined);
  useCloseOnOk(state, onClose);
  return (
    <Dialog open onClose={onClose} title={`Moderate ${target.authorName}`}>
      <form action={action} className="space-y-3">
        <input type="hidden" name="groupId" value={target.groupId ?? ""} />
        <input type="hidden" name="userId" value={target.authorId} />
        <p className="text-muted text-sm">
          Applies {target.groupId ? "in this group" : "in the daily global thread"} only. Warnings are shown
          to the user.
        </p>
        <Field label="Action">
          <Select name="action" required defaultValue="warn">
            <option value="warn">Warn</option>
            <option value="mute1">Mute for 1 day</option>
            <option value="mute7">Mute for 7 days</option>
            <option value="ban">Ban</option>
          </Select>
        </Field>
        <Field label="Message / reason" hint="Required for warnings.">
          <Textarea name="message" maxLength={500} />
        </Field>
        <FormError message={state?.error} />
        <Button disabled={pending}>{pending ? "Applying…" : "Apply"}</Button>
      </form>
    </Dialog>
  );
}
