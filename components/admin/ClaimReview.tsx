"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Field";
import {
  approveAndRelease,
  confirmAuthority,
  rejectClaim,
  saveCorroboration,
  signClaimDocument,
  startReview,
} from "@/lib/admin/actions";
import type { DeathClaim } from "@/lib/db/types";

export function ClaimReview({ claim }: { claim: DeathClaim }) {
  const [note, setNote] = useState(claim.adminNotes ?? "");
  const [authorityNote, setAuthorityNote] = useState("");
  const [message, setMessage] = useState<string>();
  const [pending, start] = useTransition();
  const done = claim.status === "approved" || claim.status === "rejected";

  function run(fn: () => Promise<void | string>) {
    setMessage(undefined);
    start(async () => {
      const m = await fn();
      if (typeof m === "string") setMessage(m);
    });
  }

  async function viewDoc(path: string | null) {
    if (!path) return;
    const url = await signClaimDocument(path);
    if (url) window.open(url, "_blank", "noopener");
  }

  return (
    <div className="space-y-5">
      {message && (
        <p className="rounded-2xl bg-sage-100 px-4 py-2.5 text-sm text-forest-800">
          {message}
        </p>
      )}

      {/* Documents */}
      <Card>
        <CardTitle>Documents</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Opens a 5-minute signed link. Viewing is audit-logged.
        </CardDescription>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!claim.deathCertificatePath}
            onClick={() => viewDoc(claim.deathCertificatePath)}
          >
            Death certificate
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!claim.proofOfAuthorityPath}
            onClick={() => viewDoc(claim.proofOfAuthorityPath)}
          >
            Proof of authority
          </Button>
        </div>
      </Card>

      {/* Corroboration — GATED, manual only */}
      <Card>
        <CardTitle>Corroboration</CardTitle>
        <CardDescription className="mt-1 mb-3">
          Manual entry only. There are no live death-database integrations — these
          notes inform your judgement and never trigger a release.
        </CardDescription>
        <Textarea
          placeholder="e.g. Funeral director confirmed by phone on 30/06; notice sighted in The Age."
          defaultValue={JSON.stringify(claim.corroboration?.notes ?? "")
            .replace(/^"|"$/g, "")}
          onBlur={(e) =>
            run(() => saveCorroboration(claim.id, { notes: e.target.value }))
          }
        />
      </Card>

      {/* Authority confirmation */}
      <Card>
        <CardTitle>Estate authority</CardTitle>
        <CardDescription className="mt-1 mb-3">
          {claim.authorityConfirmed
            ? "Confirmed — estate-tier items will be included on approval."
            : "Not confirmed. Estate/financial items will be held back until you confirm proof of legal authority."}
        </CardDescription>
        {!claim.authorityConfirmed && (
          <div className="space-y-2">
            <Textarea
              placeholder="Describe the authority sighted (e.g. Grant of Probate no. 123/2026, NSW)."
              value={authorityNote}
              onChange={(e) => setAuthorityNote(e.target.value)}
            />
            <Button
              variant="secondary"
              disabled={pending || !authorityNote.trim()}
              onClick={() => run(() => confirmAuthority(claim.id, authorityNote))}
            >
              Confirm authority
            </Button>
          </div>
        )}
      </Card>

      {/* Decision */}
      {!done && (
        <Card className="border-forest-200">
          <CardTitle>Decision</CardTitle>
          <CardDescription className="mt-1 mb-3">
            Notes are mandatory and recorded immutably. Approving releases funeral
            wishes now; estate items only if authority is confirmed.
          </CardDescription>
          <Textarea
            placeholder="Review notes (required)…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {claim.status === "submitted" && (
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => run(() => startReview(claim.id))}
              >
                Start review
              </Button>
            )}
            <Button
              disabled={pending || !note.trim()}
              onClick={() =>
                run(async () => {
                  const res = await approveAndRelease(claim.id, note);
                  return res.ok
                    ? `Approved. Released ${res.released} item(s), ${res.grants} grant(s).`
                    : res.error;
                })
              }
            >
              Approve &amp; release
            </Button>
            <Button
              variant="danger"
              disabled={pending || !note.trim()}
              onClick={() => run(() => rejectClaim(claim.id, note))}
            >
              Reject
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
