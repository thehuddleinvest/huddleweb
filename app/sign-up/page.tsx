import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage({
  searchParams,
}: {
  searchParams: { tier?: string; canceled?: string };
}) {
  return (
    <main className="container max-w-lg py-16">
      <h1 className="text-2xl font-medium">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick your tier, acknowledge the risks, and you'll head to secure checkout.
      </p>

      {searchParams.canceled && (
        <p className="mt-4 rounded-md bg-secondary p-3 text-sm text-muted-foreground">
          Checkout was canceled — no charge was made. You can pick up where you left off below.
        </p>
      )}

      <div className="mt-8">
        <SignUpForm defaultTier={searchParams.tier} />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
