import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Section, Eyebrow } from "@/components/ui/Section";
import { SecureBadge } from "@/components/ui/SecureBadge";
import { TierTag } from "@/components/ui/TierTag";
import { ProgressRing } from "@/components/ui/ProgressRing";
import {
  IconArrowRight,
  IconCheck,
  IconHeart,
  IconLock,
  IconShield,
  IconUsers,
} from "@/components/ui/icons";

const TRUST_POINTS = [
  { icon: IconShield, label: "A person reviews every release" },
  { icon: IconLock, label: "AES-256 encryption at rest" },
  { icon: IconUsers, label: "Share with your partner today" },
  { icon: IconHeart, label: "Built by the Gaia family" },
];

const STEPS = [
  {
    n: "1",
    title: "Gather, gently",
    body: "Start with your wishes, the easiest place to begin. Add people, documents, accounts and a few words at your own pace.",
  },
  {
    n: "2",
    title: "Choose who gets what",
    body: "Every item has a plain-language setting: just for you, funeral wishes, or estate and authority. You decide who receives each one.",
  },
  {
    n: "3",
    title: "Rest easy",
    body: "Nothing is ever released by a machine. A real person reviews the death certificate and proof of authority before anything is shared.",
  },
];

const FAQS = [
  {
    q: "What happens when I die?",
    a: "Someone close to you notifies us and uploads a death certificate. A member of our team reviews it carefully. Only after approval are your funeral wishes shared with your authorised funeral director, and estate information waits until legal authority is proven.",
  },
  {
    q: "Can Gaia Vault staff read my vault?",
    a: "In normal operation, no. Strict database rules mean only you can reach your vault. We are honest, though: this is not a zero-knowledge system, and the items you mark for release are deliberately recoverable by our approved, human-reviewed release process. That is what makes release possible.",
  },
  {
    q: "Who can see what I put in?",
    a: "You, and anyone you deliberately share with while you’re alive. Nominees see nothing until a claim is reviewed and approved, and then only exactly what you assigned to them.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. The free tier stays free, and the paid plan can be cancelled from your billing page in two clicks. Your plan runs to the end of the period you’ve paid for.",
  },
];

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      {/* soft glow behind the stack (blur paints beyond the box without
          affecting layout, so no negative margins: those cause page overflow) */}
      <div className="absolute inset-0 rounded-full bg-sage-100/70 blur-3xl" />

      {/* main preview card */}
      <div className="animate-float relative rounded-card border border-canvas-300/80 bg-canvas-50 p-5 shadow-lift">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100 text-forest-600">
              <IconHeart size={18} />
            </span>
            <div>
              <p className="font-display text-lg leading-tight text-forest-800">Wishes</p>
              <p className="text-xs text-ink-400">Last reviewed 3 weeks ago</p>
            </div>
          </div>
          <ProgressRing value={80} size={54} strokeWidth={5} />
        </div>
        <div className="mt-4 space-y-2.5">
          <div className="rounded-2xl border border-canvas-300 bg-canvas-100 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink-800">My funeral preferences</p>
              <TierTag tier="funeral_wishes" />
            </div>
            <p className="mt-1 truncate text-xs text-ink-400">
              A simple service among the gum trees, native flowers…
            </p>
          </div>
          <div className="rounded-2xl border border-canvas-300 bg-canvas-100 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink-800">A letter for Jess</p>
              <TierTag tier="personal" />
            </div>
            <p className="mt-1 truncate text-xs text-ink-400">
              Thank you for always picking up the phone…
            </p>
          </div>
        </div>
      </div>

      {/* floating trust chip */}
      <div
        className="animate-float absolute -right-3 -top-5 rounded-pill border border-sage-200 bg-canvas-50 px-3.5 py-2 shadow-soft sm:-right-8"
        style={{ animationDelay: "1.2s", ["--float-rot" as string]: "2deg" }}
      >
        <span className="flex items-center gap-1.5 text-xs font-medium text-forest-700">
          <IconLock size={13} /> Encrypted before it’s stored
        </span>
      </div>

      {/* floating review chip */}
      <div
        className="animate-float absolute -bottom-5 -left-2 rounded-pill border border-flame-300/60 bg-canvas-50 px-3.5 py-2 shadow-soft sm:-left-8"
        style={{ animationDelay: "2.4s", ["--float-rot" as string]: "-2deg" }}
      >
        <span className="flex items-center gap-1.5 text-xs font-medium text-flame-600">
          <IconShield size={13} /> Released only after human review
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="bg-hero">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="px-5 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/security" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                How it works
              </Button>
            </Link>
            <Link href="#pricing" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Pricing
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

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <Section className="pt-8 pb-16 sm:pt-14">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="animate-rise">
            <Eyebrow>A new home in the Gaia family</Eyebrow>
            <h1 className="mt-3 text-4xl leading-[1.06] font-display text-forest-800 sm:text-[3.4rem]">
              Organise what matters, for the people you trust.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
              Your wishes, your people, the important papers and a few words
              worth keeping, gathered gently in one calm place. Share what you
              choose today, and rest knowing the rest is cared for.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/signup">
                <Button size="lg" className="group">
                  Start your vault, free
                  <IconArrowRight
                    size={17}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </Button>
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
          <div className="animate-rise rise-2 px-2 py-6 sm:px-6">
            <HeroPreview />
          </div>
        </div>
      </Section>

      {/* ── Trust bar ──────────────────────────────────────────────────── */}
      <Section className="py-0">
        <div className="animate-rise rise-3 grid grid-cols-2 gap-x-6 gap-y-4 rounded-card border border-canvas-300/70 bg-canvas-50/80 px-6 py-5 shadow-soft backdrop-blur sm:grid-cols-4">
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-100 text-forest-600">
                <Icon size={16} />
              </span>
              <span className="text-sm text-ink-700">{label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <Section className="pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-2 text-3xl font-display text-forest-800 sm:text-4xl">
            Three gentle steps, then peace of mind.
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card key={s.n} className={`animate-rise rise-${i + 1} relative overflow-hidden`}>
              <span className="pointer-events-none absolute -right-3 -top-6 font-display text-[6.5rem] leading-none text-sage-100 select-none">
                {s.n}
              </span>
              <CardTitle className="relative">{s.title}</CardTitle>
              <CardDescription className="relative mt-2">{s.body}</CardDescription>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── Living value: partner sharing ──────────────────────────────── */}
      <Section>
        <div className="grid grid-cols-1 items-center gap-10 rounded-card border border-sage-200 bg-sage-50/70 p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Useful today, not just someday</Eyebrow>
            <h2 className="mt-2 text-3xl font-display text-forest-800">
              Share it with your partner while you’re both here.
            </h2>
            <p className="mt-4 leading-relaxed text-ink-600">
              Gaia Vault isn’t a drawer you fill and forget. Invite the person
              you trust most to co-view the things you choose: the will’s
              location, the insurance details, the account list. Useful every
              day, and priceless on the hard ones.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "Invite your partner in two clicks",
                "Choose exactly which items they can see",
                "We nudge you both when things go stale",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700">
                    <IconCheck size={12} />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-sm rounded-card border border-canvas-300 bg-canvas-50 p-5 shadow-lift">
            <p className="text-sm font-medium text-ink-700">Shared with Tom</p>
            <div className="mt-3 space-y-2">
              {[
                ["Where my will is kept", "Documents"],
                ["Everyday bank accounts", "Assets"],
                ["Our funeral preferences", "Wishes"],
              ].map(([title, section]) => (
                <div
                  key={title}
                  className="flex items-center justify-between rounded-2xl border border-canvas-300 bg-canvas-100 px-4 py-2.5"
                >
                  <span className="text-sm text-ink-800">{title}</span>
                  <span className="rounded-pill bg-sage-100 px-2 py-0.5 text-[0.68rem] font-medium text-sage-700">
                    {section}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-400">
              <IconUsers size={13} /> Tom can view these now, while you’re both living.
            </p>
          </div>
        </div>
      </Section>

      {/* ── Pricing ────────────────────────────────────────────────────── */}
      <Section id="pricing" className="pt-14">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="mt-2 text-3xl font-display text-forest-800 sm:text-4xl">
            Start free. Stay for peace of mind.
          </h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
          <Card className="flex flex-col">
            <CardTitle>Free</CardTitle>
            <p className="mt-3 font-display text-4xl text-forest-800">
              $0
              <span className="ml-1 text-base text-ink-400">forever</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink-700">
              {[
                "Your wishes and key people",
                "Encrypted at rest, always",
                "The same human-reviewed release",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <IconCheck size={15} className="mt-0.5 shrink-0 text-sage-600" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="mt-6">
              <Button variant="secondary" className="w-full">
                Begin gently
              </Button>
            </Link>
          </Card>
          <Card className="relative flex flex-col border-forest-300 shadow-lift">
            <span className="absolute -top-3 right-6 rounded-pill bg-forest-700 px-3 py-1 text-xs font-medium text-canvas-50">
              Most loved
            </span>
            <CardTitle>Gaia Vault Plus</CardTitle>
            <p className="mt-3 font-display text-4xl text-forest-800">
              A$99
              <span className="ml-1 text-base text-ink-400">/ year</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink-700">
              {[
                "Everything in Free",
                "Every section: documents, assets, messages",
                "Partner sharing while you’re living",
                "Posthumous messages, delivered gently",
                "Priority, human support",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <IconCheck size={15} className="mt-0.5 shrink-0 text-forest-600" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="mt-6">
              <Button className="w-full">Start with Plus</Button>
            </Link>
          </Card>
        </div>
        <p className="mx-auto mt-5 max-w-xl text-center text-xs text-ink-400">
          Plus renews automatically each year at A$99 unless you cancel first.
          Cancel any time; your plan runs to the end of the paid period. Prices
          include GST.
        </p>
      </Section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <Section>
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <Eyebrow>Honest answers</Eyebrow>
            <h2 className="mt-2 text-3xl font-display text-forest-800">
              The questions people actually ask.
            </h2>
          </div>
          <div className="mt-8 space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-card border border-canvas-300/80 bg-canvas-50 px-5 py-4 shadow-soft open:pb-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-forest-800 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <IconPlusRotate />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <Section>
        <div className="relative overflow-hidden rounded-card bg-forest-800 p-10 text-center sm:p-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(600px 300px at 20% 0%, var(--color-forest-600), transparent 60%), radial-gradient(500px 300px at 90% 100%, var(--color-forest-700), transparent 60%)",
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <Eyebrow className="text-sage-300">For you, and for them</Eyebrow>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-display text-canvas-50 sm:text-4xl">
              The kindest thing you’ll do for your family takes ten quiet minutes.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-canvas-200">
              Begin with one wish. That’s enough for today.
            </p>
            <div className="mt-7">
              <Link href="/signup">
                <Button size="lg" variant="secondary">
                  Start your vault, free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-canvas-300 px-5 py-12">
        <div className="mx-auto grid grid-cols-1 max-w-6xl gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-ink-500">
              Part of the Gaia family, alongside Gaia CRM, Gaia App, Funerals
              Live and Moments by Gaia.
            </p>
          </div>
          <nav aria-label="Product" className="text-sm">
            <p className="font-medium text-forest-800">Product</p>
            <ul className="mt-3 space-y-2 text-ink-500">
              <li><Link href="/security" className="hover:text-forest-700">Security</Link></li>
              <li><Link href="/security#on-death" className="hover:text-forest-700">What happens on death</Link></li>
              <li><Link href="#pricing" className="hover:text-forest-700">Pricing</Link></li>
            </ul>
          </nav>
          <nav aria-label="Support" className="text-sm">
            <p className="font-medium text-forest-800">When you need us</p>
            <ul className="mt-3 space-y-2 text-ink-500">
              <li><Link href="/claim" className="hover:text-forest-700">Notify us of a death</Link></li>
              <li><a href="https://gaiaapp.net" className="hover:text-forest-700">gaiaapp.net</a></li>
            </ul>
          </nav>
        </div>
        <p className="mx-auto mt-10 max-w-6xl text-xs leading-relaxed text-ink-400">
          Gaia Vault encrypts your information at rest. The “release set” you
          designate for after death is not zero-knowledge. We’re transparent
          about exactly what that means on our{" "}
          <Link href="/security" className="underline">security page</Link>.
        </p>
      </footer>
    </main>
  );
}

/** Plus that rotates into a close mark when the FAQ opens. */
function IconPlusRotate() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      className="shrink-0 text-sage-600 transition-transform duration-200 group-open:rotate-45"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
