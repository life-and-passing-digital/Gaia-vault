"use client";

import { useState, useTransition } from "react";
import { submitClaim } from "@/lib/claims/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export function ClaimForm() {
  const [error, setError] = useState<string>();
  const [ref, setRef] = useState<string>();
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    setError(undefined);
    start(async () => {
      const res = await submitClaim(formData);
      if (res.ok) setRef(res.ref);
      else setError(res.error);
    });
  }

  if (ref) {
    return (
      <div className="rounded-card bg-sage-50 border border-sage-200 p-6">
        <h2 className="text-xl font-display text-forest-800">Thank you.</h2>
        <p className="mt-2 text-ink-600">
          We’ve received your notification and sent a confirmation to your email.
          Your reference is <span className="font-mono text-sm">{ref}</span>. Our
          team will review it with care and be in touch. Nothing is shared until
          that review is complete.
        </p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="space-y-5">
      {error && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <fieldset className="space-y-4">
        <legend className="font-display text-lg text-forest-800">
          About the person who has died
        </legend>
        <Field label="Their full name" htmlFor="deceasedName" required>
          <Input id="deceasedName" name="deceasedName" required />
        </Field>
        <Field
          label="Their email"
          htmlFor="deceasedEmail"
          hint="The email they used with Gaia Vault, if you know it."
          required
        >
          <Input id="deceasedEmail" name="deceasedEmail" type="email" required />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-display text-lg text-forest-800">About you</legend>
        <Field label="Your full name" htmlFor="claimantName" required>
          <Input id="claimantName" name="claimantName" required />
        </Field>
        <Field label="Your email" htmlFor="claimantEmail" required>
          <Input id="claimantEmail" name="claimantEmail" type="email" required />
        </Field>
        <Field label="Your phone (optional)" htmlFor="claimantPhone">
          <Input id="claimantPhone" name="claimantPhone" type="tel" />
        </Field>
        <Field
          label="Your relationship to them"
          htmlFor="claimantRelationship"
          required
        >
          <Input id="claimantRelationship" name="claimantRelationship" required />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-display text-lg text-forest-800">Documents</legend>
        <Field
          label="Death certificate"
          htmlFor="deathCertificate"
          hint="A photo or scan is fine. This is stored privately and seen only by our review team."
        >
          <input
            id="deathCertificate"
            name="deathCertificate"
            type="file"
            accept="image/*,application/pdf"
            className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-pill file:border-0 file:bg-sage-100 file:px-4 file:py-2 file:text-forest-800"
          />
        </Field>
        <Field
          label="Proof of your authority (optional now)"
          htmlFor="proofOfAuthority"
          hint="E.g. grant of probate or letters of administration. Needed before any estate information can be shared."
        >
          <input
            id="proofOfAuthority"
            name="proofOfAuthority"
            type="file"
            accept="image/*,application/pdf"
            className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-pill file:border-0 file:bg-sage-100 file:px-4 file:py-2 file:text-forest-800"
          />
        </Field>
      </fieldset>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Submitting…" : "Submit notification"}
      </Button>
    </form>
  );
}
