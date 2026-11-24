"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ActionButton";
import { ModerateDialog } from "@/components/ContentMenu";
import { Button } from "@/components/ui";
import { deleteGroupAction, removeCommentAction, removePostAction, resolveReportAction } from "./actions";

export function ReportActions({
  report,
  canDeleteGroup,
}: {
  report: {
    id: string;
    post_id: string | null;
    comment_id: string | null;
    group_id: string | null;
    target_user_id: string | null;
    target_username: string;
    group_name: string | null;
  };
  canDeleteGroup: boolean;
}) {
  const [moderating, setModerating] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      {report.comment_id ? (
        <ActionButton
          variant="danger"
          action={removeCommentAction.bind(null, report.comment_id, "Reported")}
          confirm="Remove this comment?"
        >
          Remove comment
        </ActionButton>
      ) : report.post_id ? (
        <ActionButton
          variant="danger"
          action={removePostAction.bind(null, report.post_id, "Reported")}
          confirm="Remove this post?"
        >
          Remove post
        </ActionButton>
      ) : null}
      {report.target_user_id && (
        <Button type="button" variant="secondary" onClick={() => setModerating(true)}>
          Warn / mute / ban
        </Button>
      )}
      <ActionButton variant="ghost" action={resolveReportAction.bind(null, report.id, "resolved")}>
        Mark resolved
      </ActionButton>
      <ActionButton variant="ghost" action={resolveReportAction.bind(null, report.id, "dismissed")}>
        Dismiss
      </ActionButton>
      {canDeleteGroup && report.group_id && (
        <ActionButton
          variant="danger"
          action={deleteGroupAction.bind(null, report.group_id, "Removed by site admin after report")}
          confirm={`Delete the whole group "${report.group_name}" and all its posts? This can't be undone.`}
        >
          Delete group
        </ActionButton>
      )}
      {moderating && report.target_user_id && (
        <ModerateDialog
          target={{
            authorId: report.target_user_id,
            authorName: report.target_username,
            groupId: report.group_id,
          }}
          onClose={() => setModerating(false)}
        />
      )}
    </div>
  );
}
