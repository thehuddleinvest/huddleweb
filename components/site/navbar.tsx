"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-200",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-md"
          : "border-b border-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span aria-hidden className="text-xl">🏈</span> The Huddle
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link href="#how" className="transition-colors hover:text-foreground">How it works</Link>
          <Link href="#pricing" className="transition-colors hover:text-foreground">Pricing</Link>
          <Link href="#faq" className="transition-colors hover:text-foreground">FAQ</Link>
          <Link href="/sign-in" className="transition-colors hover:text-foreground">Sign in</Link>
          <Link href="#pricing" className={buttonVariants({ variant: "accent", size: "sm" })}>
            Join Huddle Insiders
          </Link>
        </nav>
        <Link href="#pricing" className={cn(buttonVariants({ variant: "accent", size: "sm" }), "md:hidden")}>
          Join
        </Link>
      </div>
    </header>
  );
}
