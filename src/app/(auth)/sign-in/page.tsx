import { Suspense } from "react";
import { Card } from "@/components/ui";
import { SignInForm } from "../auth-forms";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <Card>
      <h1 className="mb-4 font-serif text-2xl font-semibold">Welcome back</h1>
      <Suspense>
        <SignInForm />
      </Suspense>
    </Card>
  );
}
