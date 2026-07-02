# Gaia Vault — Website integration hand-off

How Gaia Vault (deployed standalone at `vault.gaiaapp.net`) plugs into the Gaia
family website and, later, Gaia CRM.

## 1. Where it lives

- **App:** `https://vault.gaiaapp.net` (this repo, on Vercel, `syd1`).
- **Marketing entry:** the landing page in this app (`/`) plus the public
  `/security` ("what happens on death") page. These are designed to match the
  Gaia look so the cross-link feels native.

## 2. Add "Gaia Vault" to the Products dropdown on gaiaapp.net

> **Status: done — everything on gaiaapp.net for now.** The website
> (`gaia-website-static`) now ships:
>
> - `vault.html` — a native product page at `https://gaiaapp.net/vault` that
>   recreates this app's landing page (hero + vault preview card, trust bar,
>   three steps, partner sharing, Free/Plus pricing, FAQ, final CTA) on the
>   site's LIFE design system (Taviraj/Poppins, `#1D4641` primary) while
>   keeping the Vault canvas/sage/flame look.
> - Because this app is **not yet deployed** at `vault.gaiaapp.net`, the page
>   deliberately has no links to the subdomain. The `/security` page content
>   is embedded on-page (`#how-we-keep-it-safe`) and every "Start your vault"
>   CTA scrolls to an on-page early-access form (`#start-your-vault`) that
>   posts to the site's existing `requestDemo` Cloud Function (emails
>   info@gaiaapp.net).
> - A **Gaia Vault** item in the "For families" mega menu of both header
>   partials (`partials/header.html`, `partials/primary-dark-header.html`),
>   linking to `/vault`, plus a sitemap entry.
>
> **When this app deploys**, either point the page's `#start-your-vault` CTAs
> at the live signup, or serve the app itself from a gaiaapp.net path — the
> business preference is one URL (gaiaapp.net), not a subdomain. The snippet
> below is kept for reference.

Drop this item into the existing Products menu (adjust markup to your component
system — the copy and destination are what matter):

```html
<!-- Gaia Products dropdown — add alongside Gaia CRM, Gaia App, Funerals Live, Moments -->
<a class="gaia-product-item" href="https://vault.gaiaapp.net">
  <span class="gaia-product-item__icon" aria-hidden="true">
    <!-- leaf-and-flame mark; reuse components/brand/Logo.tsx as the source -->
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <path d="M16 3C9 6 5 11 5 17c0 6 4.5 11 11 12 6.5-1 11-6 11-12 0-6-4-11-11-14Z" fill="#d2e0cc"/>
      <path d="M16 12c2.4 1.8 3.6 3.7 3.6 5.7A3.6 3.6 0 0 1 16 21.3a3.6 3.6 0 0 1-3.6-3.6c0-2 1.2-3.9 3.6-5.7Z" fill="#c97b4a"/>
    </svg>
  </span>
  <span class="gaia-product-item__text">
    <strong>Gaia Vault</strong>
    <small>Organise what matters, for the people you trust.</small>
  </span>
</a>
```

For a "For families" CTA block, link to `https://vault.gaiaapp.net/signup` with
the label **"Start your vault"**.

## 3. Shared brand assets

The Vault design tokens are the source of truth in `app/globals.css` (`@theme`).
Key values for the website to match the menu item:

| Token | Value |
| --- | --- |
| Forest (primary) | `#264430` |
| Sage (surface) | `#e7efe3` |
| Flame (accent) | `#c97b4a` |
| Canvas (bg) | `#fbf9f4` |
| Display font | Fraunces |
| Body font | Inter |

The logo mark is `components/brand/Logo.tsx` — export it to SVG/PNG for the
website's asset pipeline if a static file is preferred.

## 4. Linking in (and out)

- Website → Vault: Products menu item + "For families" CTA (above).
- Vault → Website: the Vault footer links back to `gaiaapp.net`.
- Bereavement: surface a clear path to `vault.gaiaapp.net/claim`
  ("Notify us of a death") from Funerals Live and the main site footer.

## 5. Later: Gaia CRM read/write (NOT in v1)

- Interface is defined in `lib/integrations/crm.ts` (`CrmSyncPort`).
- It is disabled behind `FEATURE_CRM_SYNC=false` and throws if called.
- **LEGAL-GATE:** cross-product data sharing needs explicit user consent + a DPA
  review before enabling (see `docs/LEGAL-GATES.md`, gate 4). Only consented,
  non-sensitive fields may ever cross the boundary — never vault contents.

## 6. Auth & accounts

- Vault uses its own Supabase Auth (separate from Gaia CRM's Firebase). v1 does
  **not** share sign-in with the rest of the family. If single-sign-on across
  Gaia products is desired later, it belongs behind the same consent/DPA gate as
  CRM sync, and would be added at the `lib/db`/auth boundary without touching
  feature code.
