import Link from "next/link";
import { Button } from "@/components/ui/button";

// Sign-in stub. Wire to Supabase auth (email magic link / password) next.
export default function SignInPage() {
  return (
    <main className="container max-w-sm py-20">
      <h1 className="text-2xl font-medium">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Welcome back to Huddle Insiders.
      </p>
      <div className="mt-8 space-y-3">
        <input
          type="email"
          placeholder="name@example.com"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
        <Button className="w-full">Send magic link</Button>
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
