import { Suspense } from "react";
import { Card } from "@/components/ui";
import { SignUpForm } from "../auth-forms";

export const metadata = { title: "Create an account" };

export default function SignUpPage() {
  return (
    <Card>
      <h1 className="mb-4 text-2xl font-bold">Join OneJoy</h1>
      <Suspense>
        <SignUpForm />
      </Suspense>
    </Card>
  );
}
