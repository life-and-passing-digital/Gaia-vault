"use client";

import { useState, useTransition } from "react";
import { createItem } from "@/lib/vault/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { RELEASE_TIERS, RELEASE_TIER_IDS } from "@/lib/vault/tiers";
import type { SectionType } from "@/lib/db/types";

/**
 * Add a vault item. The release-tier selector shows the plain-language meaning
 * of each tier so the user always knows *who gets this, and when*.
 */
export function ItemEditor({ section }: { section: SectionType }) {
  const [tier, setTier] = useState<(typeof RELEASE_TIER_IDS)[number]>("personal");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  function onSubmit(formData: FormData) {
    setError(undefined);
    start(async () => {
      const res = await createItem(formData);
      if (!res.ok) setError(res.error);
      else {
        setOpen(false);
        (document.getElementById(`add-${section}`) as HTMLFormElement)?.reset();
      }
    });
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        + Add to this section
      </Button>
    );
  }

  return (
    <form id={`add-${section}`} action={onSubmit} className="space-y-4 rounded-card border border-canvas-300 bg-canvas-50 p-5">
      <input type="hidden" name="section" value={section} />
      <input type="hidden" name="releaseTier" value={tier} />
      {error && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <Field label="Title" htmlFor="title" required>
        <Input id="title" name="title" placeholder="e.g. My funeral preferences" required />
      </Field>
      <Field label="Details" htmlFor="body">
        <Textarea id="body" name="body" placeholder="Write as much or as little as you like." />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink-700">Who is this for?</legend>
        <div className="grid gap-2">
          {RELEASE_TIER_IDS.map((id) => {
            const t = RELEASE_TIERS[id];
            return (
              <label
                key={id}
                className={`flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm ${
                  tier === id
                    ? "border-forest-500 bg-sage-50"
                    : "border-canvas-300 hover:bg-sage-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="tier-choice"
                  className="mt-1"
                  checked={tier === id}
                  onChange={() => setTier(id)}
                />
                <span>
                  <span className="font-medium text-forest-800">{t.label}</span>
                  <span className="mt-0.5 block text-ink-500">{t.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving securely…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
