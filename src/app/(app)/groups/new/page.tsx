import { Card, PageTitle } from "@/components/ui";
import { GroupForm } from "../group-form";

export const metadata = { title: "New group" };

export default function NewGroupPage() {
  return (
    <div>
      <PageTitle sub="You'll be the owner and can invite others.">New group</PageTitle>
      <Card>
        <GroupForm />
      </Card>
    </div>
  );
}
