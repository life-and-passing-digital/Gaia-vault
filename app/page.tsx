import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Section, Eyebrow } from "@/components/ui/Section";
import { SecureBadge } from "@/components/ui/SecureBadge";

export default function HomePage() {
  return (
    <main>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="px-5 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link href="/security">
              <Button variant="ghost" size="sm">
                How it works
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero — sell to the living, calm and warm ───────────────────── */}
      <Section className="pt-10 pb-12 sm:pt-16">
        <div className="max-w-2xl">
          <Eyebrow>A new home in the Gaia family</Eyebrow>
          <h1 className="mt-3 text-4xl sm:text-5xl font-display text-forest-800 leading-[1.08]">
            Organise what matters,
            <br />
            for the people you trust.
          </h1>
          <p className="mt-5 text-lg text-ink-500 leading-relaxed">
            Gather your wishes, your important people, documents and a few words
            you’d want remembered — gently, in one calm place. Share what you
            choose with those close to you today, and rest knowing the rest is
            cared for.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/signup">
              <Button size="lg">Start your vault — free</Button>
            </Link>
            <Link href="/security">
              <Button size="lg" variant="secondary">
                See how we keep it safe
              </Button>
            </Link>
          </div>
          <div className="mt-6">
            <SecureBadge label="Encrypted at rest · MFA available · Australian data residency" />
          </div>
        </div>
      </Section>

      {/* ── Three gentle promises ──────────────────────────────────────── */}
      <Section className="py-8">
        <div className="grid gap-5 sm:grid-cols-3">
          <Card>
            <CardTitle>Start with the easy things</CardTitle>
            <CardDescription className="mt-2">
              Begin with your wishes — the lowest-stress place to start. Add
              people, documents and messages whenever you’re ready.
            </CardDescription>
          </Card>
          <Card>
            <CardTitle>Share while you’re here</CardTitle>
            <CardDescription className="mt-2">
              Invite a partner to co-view what you choose, today. Not a someday
              thing — a useful, shared place right now.
            </CardDescription>
          </Card>
          <Card>
            <CardTitle>Cared for, with people in the loop</CardTitle>
            <CardDescription className="mt-2">
              Nothing is released by a machine. A real person reviews every
              claim, with a death certificate and proof of authority, first.
            </CardDescription>
          </Card>
        </div>
      </Section>

      {/* ── For families CTA — consistent with Gaia Products menu ───────── */}
      <Section>
        <Card className="bg-forest-800 border-forest-700 text-canvas-100">
          <Eyebrow className="text-sage-300">For families</Eyebrow>
          <h2 className="mt-2 text-2xl sm:text-3xl font-display text-canvas-50">
            Part of the Gaia family — alongside Gaia CRM, Gaia App, Funerals Live
            and Moments by Gaia.
          </h2>
          <p className="mt-3 max-w-2xl text-canvas-200">
            Gaia Vault is built for the moments that matter most. When the time
            comes, it works hand in hand with the people and services already
            caring for your family.
          </p>
          <div className="mt-6">
            <Link href="/signup">
              <Button size="lg" variant="secondary">
                Get started
              </Button>
            </Link>
          </div>
        </Card>
      </Section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-canvas-300 px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
            <Link href="/security" className="hover:text-forest-700">
              Security
            </Link>
            <Link href="/security#on-death" className="hover:text-forest-700">
              What happens on death
            </Link>
            <Link href="/claim" className="hover:text-forest-700">
              Notify us of a death
            </Link>
            <a href="https://gaiaapp.net" className="hover:text-forest-700">
              gaiaapp.net
            </a>
          </nav>
        </div>
        <p className="mx-auto mt-6 max-w-6xl text-xs text-ink-400">
          Gaia Vault encrypts your information at rest. The “release set” you
          designate for after death is not zero-knowledge — we’re transparent
          about exactly what that means on our{" "}
          <Link href="/security" className="underline">
            security page
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}
