"use client";

import { useState } from "react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

type Stage =
  | { name: "idle" }
  | { name: "enrolling"; factorId: string; qr: string }
  | { name: "done" };

/**
 * Optional TOTP MFA enrolment. Talks to Supabase Auth directly from the browser
 * (anon key); the secret/QR never touches our server. Surfaced in account
 * settings as a calm, optional security upgrade.
 */
export function MfaSetup({ alreadyEnrolled }: { alreadyEnrolled: boolean }) {
  const [stage, setStage] = useState<Stage>(
    alreadyEnrolled ? { name: "done" } : { name: "idle" },
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const sb = createSupabaseBrowserClient();

  async function begin() {
    setBusy(true);
    setError(undefined);
    const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);
    if (error || !data) return setError(error?.message ?? "Couldn’t start setup.");
    setStage({ name: "enrolling", factorId: data.id, qr: data.totp.qr_code });
  }

  async function confirm() {
    if (stage.name !== "enrolling") return;
    setBusy(true);
    setError(undefined);
    const challenge = await sb.auth.mfa.challenge({ factorId: stage.factorId });
    if (challenge.error || !challenge.data) {
      setBusy(false);
      return setError("Couldn’t verify. Please try again.");
    }
    const { error } = await sb.auth.mfa.verify({
      factorId: stage.factorId,
      challengeId: challenge.data.id,
      code,
    });
    setBusy(false);
    if (error) return setError("That code wasn’t right. Please try again.");
    setStage({ name: "done" });
  }

  if (stage.name === "done") {
    return (
      <p className="rounded-2xl bg-sage-100 px-4 py-3 text-sm text-forest-800">
        Two-step verification is on. Your vault has an extra layer of protection.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      {stage.name === "idle" && (
        <Button onClick={begin} disabled={busy}>
          {busy ? "Preparing…" : "Turn on two-step verification"}
        </Button>
      )}
      {stage.name === "enrolling" && (
        <div className="space-y-4">
          <p className="text-sm text-ink-500">
            Scan this with your authenticator app, then enter the 6-digit code.
          </p>
          {/* Supabase returns an SVG data URL for the QR. */}
          <Image
            src={stage.qr}
            alt="MFA QR code"
            width={180}
            height={180}
            unoptimized
            className="rounded-xl border border-canvas-300 bg-white p-2"
          />
          <Field label="Code" htmlFor="mfa-code">
            <Input
              id="mfa-code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>
          <Button onClick={confirm} disabled={busy || code.length !== 6}>
            {busy ? "Verifying…" : "Confirm"}
          </Button>
        </div>
      )}
    </div>
  );
}
