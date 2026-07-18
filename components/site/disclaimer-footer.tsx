import Link from "next/link";
import { DISCLAIMERS } from "@/lib/tiers";

// Persistent site footer. §8.5 requires a disclaimer on every page.
export function DisclaimerFooter() {
  return (
    <footer className="border-t border-border bg-secondary/20">
      <div className="container py-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <span aria-hidden className="text-xl">🏈</span> The Huddle
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Educational stock analysis for Huddle Insiders. We scout the data —
              you make every call.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div className="space-y-2">
              <p className="font-medium">Product</p>
              <Link href="#how" className="block text-muted-foreground hover:text-foreground">How it works</Link>
              <Link href="#pricing" className="block text-muted-foreground hover:text-foreground">Pricing</Link>
              <Link href="#faq" className="block text-muted-foreground hover:text-foreground">FAQ</Link>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Account</p>
              <Link href="/sign-in" className="block text-muted-foreground hover:text-foreground">Sign in</Link>
              <Link href="/sign-up" className="block text-muted-foreground hover:text-foreground">Sign up</Link>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Legal</p>
              <Link href="/terms" className="block text-muted-foreground hover:text-foreground">Terms of Service</Link>
              <Link href="/privacy" className="block text-muted-foreground hover:text-foreground">Privacy Policy</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="max-w-4xl text-xs leading-relaxed text-muted-foreground">
            {DISCLAIMERS.marketingFooter}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} The Huddle. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
