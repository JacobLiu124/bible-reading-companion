import { Suspense } from "react";
import { Card } from "@/components/ui";
import { SignInForm } from "../auth-forms";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <Card>
      <h1 className="mb-4 text-2xl font-bold">Welcome back</h1>
      <Suspense>
        <SignInForm />
      </Suspense>
    </Card>
  );
}
