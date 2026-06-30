import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/email";

export const runtime = "nodejs";

// A section untouched for this long earns a gentle "is this still right?" nudge.
const STALE_DAYS = 180;
const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://vault.gaiaapp.net";

/**
 * Anti-rot nudge scheduler. Invoked daily by Vercel Cron (see vercel.json) or
 * the equivalent Supabase Edge Function. Sends at most one calm review nudge
 * per person per run. Protected by CRON_SECRET so it can't be triggered openly.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const svc = createSupabaseServiceClient();
  const cutoff = new Date(Date.now() - STALE_DAYS * 86_400_000).toISOString();

  // Vaults with at least one stale (or never-reviewed) section, with content.
  const { data: stale } = await svc
    .from("vault_sections")
    .select("vault_id, section, last_reviewed_at, vaults!inner(owner_id)")
    .or(`last_reviewed_at.lt.${cutoff},last_reviewed_at.is.null`);

  if (!stale || stale.length === 0) {
    return NextResponse.json({ nudged: 0 });
  }

  // One nudge per owner per run.
  const seen = new Set<string>();
  const email = getEmailProvider();
  let nudged = 0;

  for (const row of stale as unknown as { vaults: { owner_id: string } }[]) {
    const ownerId = row.vaults.owner_id;
    if (seen.has(ownerId)) continue;
    seen.add(ownerId);

    const { data: profile } = await svc
      .from("profiles")
      .select("email, full_name")
      .eq("id", ownerId)
      .maybeSingle();
    if (!profile?.email) continue;

    await email.send({
      to: profile.email,
      subject: "A gentle nudge from Gaia Vault",
      text:
        `Hello${profile.full_name ? ` ${profile.full_name.split(" ")[0]}` : ""},\n\n` +
        `It’s been a little while. Life changes — a move, a new arrival, a ` +
        `change of heart. When you have a quiet moment, it’s worth a look to ` +
        `make sure everything still feels right.\n\n` +
        `${appUrl()}/dashboard\n\nNo rush, and nothing to worry about.\n\n` +
        `With care,\nThe Gaia Vault team`,
      tag: "review-nudge",
    });
    await svc.rpc("append_audit", {
      p_actor_id: null,
      p_actor_role: "system",
      p_action: "nudge.sent",
      p_entity_type: "profile",
      p_entity_id: ownerId,
      p_metadata: { kind: "review" },
    });
    nudged += 1;
  }

  return NextResponse.json({ nudged });
}
