# Gaia Vault — Component library

A small, documented set of primitives that carry the Gaia look (sage & forest
greens, a warm flame accent, serif display headings, soft rounded cards,
generous whitespace). Import from `@/components/ui`.

| Component                                   | Purpose                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `Button`                                    | Pill primary control. Variants: `primary`, `secondary`, `ghost`, `danger`. |
| `Card` / `CardHeader` / `CardTitle` / `CardDescription` | Soft elevated surface; `interactive` adds hover lift.       |
| `Section` / `Eyebrow`                       | Whitespace-rich content band + small label.                             |
| `ProgressRing`                              | The "peace-of-mind" completion indicator. Accessible progressbar.       |
| `SecureBadge`                               | Honest encryption trust signal (label configurable — no overclaiming).  |
| `TierTag`                                   | Release-tier pill, wording driven by `lib/vault/tiers`.                 |
| `EmptyState`                                | Warm, encouraging empty states.                                         |
| `Field` / `Input` / `Textarea`             | Accessible labelled form controls (label/hint/error wired via aria).    |
| `brand/Logo`                                | Leaf-and-flame wordmark.                                                 |

## Principles

- **Accessible by default.** Real semantic elements, visible focus rings,
  `aria-*` wiring, reduced-motion respected globally (see `app/globals.css`).
- **Honest copy.** Security components never imply zero-knowledge for the
  release set. See `/docs/SECURITY.md`.
- **Tokens, not magic numbers.** Colours, radii and shadows come from the
  `@theme` block in `app/globals.css`.
