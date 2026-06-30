import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Section, Eyebrow } from "@/components/ui/Section";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { SecureBadge } from "@/components/ui/SecureBadge";

export const metadata = {
  title: "Security & what happens on death",
  description:
    "Plain-language explanation of how Gaia Vault protects your information and what happens, with human review, after death.",
};

export default function SecurityPage() {
  return (
    <main className="min-h-dvh bg-canvas-100">
      <header className="px-5 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <Link href="/signup" className="text-sm text-forest-700 hover:underline">
            Get started
          </Link>
        </div>
      </header>

      <Section className="py-10" containerClassName="max-w-3xl">
        <Eyebrow>Plain language, no overclaiming</Eyebrow>
        <h1 className="mt-2 text-4xl font-display text-forest-800">
          How we keep your information safe
        </h1>
        <p className="mt-4 text-lg text-ink-600 leading-relaxed">
          You’re trusting us with some of the most personal information you have.
          Here’s exactly how we protect it, and just as importantly, what we
          can and can’t do. We’d rather be honest than impressive.
        </p>
        <div className="mt-5">
          <SecureBadge label="AES-256 encryption · MFA available · Australian data residency" />
        </div>

        <div className="mt-10 space-y-4">
          <Card>
            <CardTitle>Your information is encrypted</CardTitle>
            <CardDescription className="mt-2">
              Everything you save is encrypted (AES-256-GCM) before it’s stored.
              In everyday use, only you can see your vault, protected by your
              login, optional two-step verification, and strict access rules in
              our database.
            </CardDescription>
          </Card>

          <Card>
            <CardTitle>We’re honest: this isn’t “zero-knowledge”</CardTitle>
            <CardDescription className="mt-2">
              Some services claim they can <em>never</em> see your data. We don’t
              make that claim, because it wouldn’t be true here, and being able
              to release your wishes after you’re gone depends on it. Information
              you mark for release after death is encrypted in a way that an
              approved, human-reviewed process can unlock for the right person.
              We never call this end-to-end or zero-knowledge.
            </CardDescription>
          </Card>

          <Card id="on-death">
            <CardTitle>What happens when someone dies</CardTitle>
            <CardDescription className="mt-2">
              Nothing is released by a computer. Ever. The path is always:
            </CardDescription>
            <ol className="mt-4 space-y-2 text-sm text-ink-600">
              <li>
                <strong>1.</strong> Someone close submits a notification and
                uploads a death certificate and proof of their authority.
              </li>
              <li>
                <strong>2.</strong> A real member of our team reviews it
                carefully. They can see the documents; the person notifying can
                see none of your vault.
              </li>
              <li>
                <strong>3.</strong> Only after approval is anything shared.
                Funeral wishes can go to your authorised funeral director soon
                after approval. Financial and estate information waits until
                proof of legal authority (like a grant of probate) is confirmed.
              </li>
              <li>
                <strong>4.</strong> The people you chose receive secure,
                time-limited access to exactly what you left them, and nothing
                else. Every release is logged permanently.
              </li>
            </ol>
          </Card>

          <Card>
            <CardTitle>The things we deliberately don’t do yet</CardTitle>
            <CardDescription className="mt-2">
              We won’t store your banking passwords yet, and we don’t plug into
              government death registries. These need legal and security sign-off
              first, and we’d rather wait than get them wrong. You’ll see them
              marked “coming soon.”
            </CardDescription>
          </Card>

          <Card>
            <CardTitle>Audit & transparency</CardTitle>
            <CardDescription className="mt-2">
              We keep a permanent, tamper-evident log of sensitive actions: who
              accessed what, and every release. We log <em>actions</em>, never
              the contents of your vault.
            </CardDescription>
          </Card>
        </div>

        <div className="mt-10 rounded-card border border-canvas-300 bg-canvas-50 p-5 text-sm text-ink-500">
          <p className="font-medium text-forest-800">Certifications</p>
          <p className="mt-1">
            Independent security review and certifications are part of our
            pre-launch checklist. This section will list them as they’re
            completed.
          </p>
        </div>
      </Section>
    </main>
  );
}
