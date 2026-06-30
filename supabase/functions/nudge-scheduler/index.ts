// ═════════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: nudge-scheduler
//
// Anti-rot reminders. Schedule daily (Supabase cron or Vercel cron → this fn).
// Sends at most one gentle review nudge per person per run. Email delivery is
// stubbed here behind RESEND_API_KEY; mirror lib/email's "notify, never content"
// rule. The equivalent app route is app/api/cron/nudges/route.ts.
// ═════════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STALE_DAYS = 180;

Deno.serve(async () => {
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const cutoff = new Date(Date.now() - STALE_DAYS * 86_400_000).toISOString();

  const { data: stale } = await sb
    .from("vault_sections")
    .select("vault_id, vaults!inner(owner_id)")
    .or(`last_reviewed_at.lt.${cutoff},last_reviewed_at.is.null`);

  const seen = new Set<string>();
  let nudged = 0;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") ?? "Gaia Vault <care@vault.gaiaapp.net>";
  const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://vault.gaiaapp.net";

  for (const row of (stale ?? []) as Array<{ vaults: { owner_id: string } }>) {
    const ownerId = row.vaults.owner_id;
    if (seen.has(ownerId)) continue;
    seen.add(ownerId);

    const { data: profile } = await sb
      .from("profiles")
      .select("email, full_name")
      .eq("id", ownerId)
      .maybeSingle();
    if (!profile?.email) continue;

    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: profile.email,
          subject: "A gentle nudge from Gaia Vault",
          text:
            `Hello,\n\nIt’s been a little while. When you have a quiet moment, ` +
            `it’s worth a look to make sure everything still feels right.\n\n` +
            `${appUrl}/dashboard\n\nWith care,\nThe Gaia Vault team`,
        }),
      });
    }
    await sb.rpc("append_audit", {
      p_actor_id: null,
      p_actor_role: "system",
      p_action: "nudge.sent",
      p_entity_type: "profile",
      p_entity_id: ownerId,
      p_metadata: { kind: "review", via: "edge-function" },
    });
    nudged += 1;
  }

  return new Response(JSON.stringify({ nudged }), {
    headers: { "content-type": "application/json" },
  });
});
