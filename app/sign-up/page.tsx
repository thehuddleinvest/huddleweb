"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DISCLAIMERS } from "@/lib/tiers";

// §2.2 + §8.1: both risk acknowledgments are required before sign-up can proceed.
// The timestamp + IP must be written to `users` (risk_ack_signup_at / _ip) and
// `audit_log` server-side once account creation is wired up.
export default function SignUpPage() {
  const [ackOne, setAckOne] = useState(false);
  const [ackTwo, setAckTwo] = useState(false);
  const canContinue = ackOne && ackTwo;

  return (
    <main className="container max-w-lg py-16">
      <h1 className="text-2xl font-medium">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Before you continue, please read and acknowledge the following.
      </p>

      <div className="mt-8 space-y-4">
        <label className="flex gap-3 rounded-lg border border-border p-4 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={ackOne}
            onChange={(e) => setAckOne(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <span>{DISCLAIMERS.riskAckOne}</span>
        </label>

        <label className="flex gap-3 rounded-lg border border-border p-4 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={ackTwo}
            onChange={(e) => setAckTwo(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <span>{DISCLAIMERS.riskAckTwo}</span>
        </label>
      </div>

      <Button className="mt-8 w-full" disabled={!canContinue}>
        Continue to payment
      </Button>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {DISCLAIMERS.dashboardFooter}
      </p>
    </main>
  );
}
