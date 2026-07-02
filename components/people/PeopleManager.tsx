"use client";

import { useTransition } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { TierTag } from "@/components/ui/TierTag";
import { RELEASE_TIERS, RELEASE_TIER_IDS } from "@/lib/vault/tiers";
import {
  addFuneralDirector,
  addNominee,
  invitePartner,
  removeNominee,
} from "@/lib/people/actions";
import type { FuneralDirector, Nominee } from "@/lib/db/types";

export function PeopleManager({
  nominees,
  directors,
  invites,
}: {
  nominees: Nominee[];
  directors: FuneralDirector[];
  invites: { partner_email: string; status: string }[];
}) {
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      {/* Partner sharing — prominent retention driver */}
      <Card className="border-forest-200 bg-sage-50/50">
        <CardTitle>Share with your partner, today</CardTitle>
        <CardDescription className="mt-1 mb-4">
          Invite someone you trust to co-view the things you choose, now, while
          you’re here. Not a someday thing; a useful, shared place.
        </CardDescription>
        <form action={(fd) => start(() => invitePartner(fd).then(() => {}))} className="flex gap-2">
          <Input name="partnerEmail" type="email" placeholder="their@email.com" required />
          <Button type="submit" disabled={pending}>Invite</Button>
        </form>
        {invites.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-ink-500">
            {invites.map((i) => (
              <li key={i.partner_email}>
                {i.partner_email}: <span className="capitalize">{i.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Nominees */}
      <Card>
        <CardTitle>People to notify or receive</CardTitle>
        <CardDescription className="mt-1 mb-4">
          Add the people who should be told, or receive what you’ve left them.
          You decide what each person is entitled to.
        </CardDescription>

        {nominees.length > 0 && (
          <ul className="mb-4 space-y-2">
            {nominees.map((n) => (
              <li
                key={n.id}
                className="flex items-center justify-between rounded-2xl border border-canvas-300 px-4 py-2.5"
              >
                <span>
                  <span className="font-medium text-forest-800">{n.fullName}</span>
                  {n.relationship && (
                    <span className="text-sm text-ink-400"> · {n.relationship}</span>
                  )}
                </span>
                <span className="flex items-center gap-3">
                  <TierTag tier={n.entitledTier} />
                  <button
                    onClick={() => start(() => removeNominee(n.id).then(() => {}))}
                    className="text-sm text-ink-400 hover:text-[var(--color-danger)]"
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <form action={(fd) => start(() => addNominee(fd).then(() => {}))} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Name" htmlFor="n-name" required>
            <Input id="n-name" name="fullName" required />
          </Field>
          <Field label="Relationship" htmlFor="n-rel">
            <Input id="n-rel" name="relationship" placeholder="e.g. daughter" />
          </Field>
          <Field label="Email" htmlFor="n-email">
            <Input id="n-email" name="email" type="email" />
          </Field>
          <Field label="Entitled to" htmlFor="n-tier">
            <select
              id="n-tier"
              name="entitledTier"
              defaultValue="funeral_wishes"
              className="w-full rounded-2xl border border-canvas-400 bg-canvas-50 px-4 py-2.5"
            >
              {RELEASE_TIER_IDS.filter((t) => t !== "personal").map((t) => (
                <option key={t} value={t}>
                  {RELEASE_TIERS[t].label}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary" disabled={pending}>
              Add person
            </Button>
          </div>
        </form>
      </Card>

      {/* Funeral director */}
      <Card>
        <CardTitle>Funeral director</CardTitle>
        <CardDescription className="mt-1 mb-4">
          Authorise a funeral director to receive your funeral wishes soon after a
          claim is approved, so they can be honoured in time.
        </CardDescription>
        {directors.length > 0 && (
          <ul className="mb-4 space-y-2 text-sm">
            {directors.map((d) => (
              <li key={d.id} className="rounded-2xl border border-canvas-300 px-4 py-2.5">
                <span className="font-medium text-forest-800">{d.businessName}</span>{" "}
                <span className="text-ink-400">· {d.email}</span>
              </li>
            ))}
          </ul>
        )}
        <form action={(fd) => start(() => addFuneralDirector(fd).then(() => {}))} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Business name" htmlFor="d-biz" required>
            <Input id="d-biz" name="businessName" required />
          </Field>
          <Field label="Contact name" htmlFor="d-contact">
            <Input id="d-contact" name="contactName" />
          </Field>
          <Field label="Email" htmlFor="d-email" required>
            <Input id="d-email" name="email" type="email" required />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary" disabled={pending}>
              Authorise director
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
