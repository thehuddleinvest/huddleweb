// Strategist access is gated by an env allowlist (comma-separated emails).
// e.g. STRATEGIST_EMAILS="va@thehuddleinvest.com,qg@thehuddleinvest.com"
export function isStrategist(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (process.env.STRATEGIST_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}
