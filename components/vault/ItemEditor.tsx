"use client";

import { useState, useTransition } from "react";
import { createItem } from "@/lib/vault/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { IconPlus, IconSparkle } from "@/components/ui/icons";
import { RELEASE_TIERS, RELEASE_TIER_IDS } from "@/lib/vault/tiers";
import type { SectionType } from "@/lib/db/types";

/**
 * Add a vault item. Starter suggestions open the form with the title
 * pre-filled, so the first step is one tap instead of a blank page. The
 * release-tier selector shows the plain-language meaning of each tier so the
 * user always knows who gets this, and when.
 */
export function ItemEditor({
  section,
  suggestions = [],
  usedTitles = [],
}: {
  section: SectionType;
  suggestions?: string[];
  usedTitles?: string[];
}) {
  const [tier, setTier] = useState<(typeof RELEASE_TIER_IDS)[number]>("personal");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const used = new Set(usedTitles.map((t) => t.toLowerCase()));
  const remaining = suggestions.filter((s) => !used.has(s.toLowerCase()));

  function openWith(prefill: string) {
    setTitle(prefill);
    setError(undefined);
    setOpen(true);
  }

  function onSubmit(formData: FormData) {
    setError(undefined);
    start(async () => {
      const res = await createItem(formData);
      if (!res.ok) setError(res.error);
      else {
        setOpen(false);
        setTitle("");
        (document.getElementById(`add-${section}`) as HTMLFormElement)?.reset();
      }
    });
  }

  if (!open) {
    return (
      <div className="space-y-3">
        {remaining.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-sage-600">
              <IconSparkle size={13} /> Ideas to start with
            </p>
            <div className="flex flex-wrap gap-2">
              {remaining.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => openWith(s)}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-sage-300 bg-canvas-50 px-3.5 py-1.5 text-sm text-forest-700 transition-colors hover:border-forest-500 hover:bg-sage-50"
                >
                  <IconPlus size={13} className="text-sage-500" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <Button variant="secondary" onClick={() => openWith("")}>
          <IconPlus size={15} /> Add something else
        </Button>
      </div>
    );
  }

  return (
    <form
      id={`add-${section}`}
      action={onSubmit}
      className="animate-rise space-y-4 rounded-card border border-canvas-300 bg-canvas-50 p-5 shadow-soft"
    >
      <input type="hidden" name="section" value={section} />
      <input type="hidden" name="releaseTier" value={tier} />
      {error && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <Field label="Title" htmlFor="title" required>
        <Input
          id="title"
          name="title"
          placeholder="e.g. My funeral preferences"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />
      </Field>
      <Field label="Details" htmlFor="body">
        <Textarea
          id="body"
          name="body"
          placeholder="Write as much or as little as you like. You can always come back."
        />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink-700">Who is this for?</legend>
        <div className="grid gap-2">
          {RELEASE_TIER_IDS.map((id) => {
            const t = RELEASE_TIERS[id];
            return (
              <label
                key={id}
                className={`flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm transition-colors ${
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
