import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <main className="container max-w-sm py-20">
      <h1 className="text-2xl font-medium">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Welcome back to Huddle Insiders.
      </p>

      <div className="mt-8">
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/#pricing" className="text-accent hover:underline">
          Choose a tier
        </Link>
      </p>
    </main>
  );
}
