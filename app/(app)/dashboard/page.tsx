import Link from "next/link";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { SectionIcon } from "@/components/vault/sectionIcons";
import {
  IconArrowRight,
  IconCheck,
  IconShield,
  IconSparkle,
  IconUsers,
} from "@/components/ui/icons";
import { SECTIONS, completeness } from "@/lib/vault/sections";
import { sectionCounts } from "@/lib/vault/actions";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export const metadata = { title: "Home" };

export default async function DashboardPage() {
  const user = await requireUser();
  const db = await getDb();
  const profile = await db.getProfile(user.id);
  const counts = await sectionCounts();
  const score = completeness(counts);
  const firstName = profile?.fullName?.split(" ")[0] ?? "there";
  const started = SECTIONS.filter((s) => (counts[s.type] ?? 0) > 0).length;
  const nextSection = SECTIONS.find((s) => (counts[s.type] ?? 0) === 0);

  return (
    <div className="space-y-8">
      {/* ── Greeting + peace-of-mind score ─────────────────────────────── */}
      <section className="animate-rise flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <ProgressRing value={score} size={104} />
        <div>
          <h1 className="text-3xl font-display text-forest-800 sm:text-4xl">
            Hello {firstName}.
          </h1>
          <p className="mt-1.5 max-w-prose text-ink-500">
            {started === 0
              ? "Welcome. Let’s start with something easy, at whatever pace feels right."
              : started < SECTIONS.length
                ? `You’ve started ${started} of ${SECTIONS.length} sections. A little at a time is just right.`
                : "Everything’s in place. We’ll nudge you now and then to keep it current."}
          </p>
        </div>
      </section>

      {/* ── Next gentle step ───────────────────────────────────────────── */}
      {nextSection ? (
        <Link href={`/vault/${nextSection.type}`} className="block">
          <section className="animate-rise rise-1 group relative overflow-hidden rounded-card bg-forest-800 p-6 shadow-lift transition-shadow hover:shadow-lift sm:p-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                background:
                  "radial-gradient(480px 240px at 85% 0%, var(--color-forest-600), transparent 60%)",
              }}
              aria-hidden="true"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest-600/60 text-sage-200">
                  <SectionIcon section={nextSection.type} size={22} />
                </span>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.15em] text-sage-300">
                    <IconSparkle size={13} /> Your next gentle step
                  </p>
                  <h2 className="mt-1 text-xl font-display text-canvas-50 sm:text-2xl">
                    {started === 0 ? `Begin with your ${nextSection.label.toLowerCase()}` : `Add your ${nextSection.label.toLowerCase()}`}
                  </h2>
                  <p className="mt-1 max-w-md text-sm text-canvas-200">
                    {nextSection.prompt}
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-2 rounded-pill bg-canvas-50 px-5 py-2.5 text-sm font-medium text-forest-800 transition-transform duration-200 group-hover:translate-x-0.5">
                Take five minutes <IconArrowRight size={15} />
              </span>
            </div>
          </section>
        </Link>
      ) : (
        <section className="animate-rise rise-1 flex items-center gap-3 rounded-card border border-sage-200 bg-sage-50 px-6 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-100 text-forest-700">
            <IconCheck size={17} />
          </span>
          <p className="text-sm text-forest-800">
            Every section has something in it. Well done. Reviewing once a season
            keeps it all true.
          </p>
        </section>
      )}

      {/* ── Sections ───────────────────────────────────────────────────── */}
      <section className="animate-rise rise-2">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-sage-600">
          Your vault
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => {
            const n = counts[s.type] ?? 0;
            const startedSection = n > 0;
            return (
              <Link key={s.type} href={`/vault/${s.type}`}>
                <Card interactive className="group h-full">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${
                        startedSection
                          ? "bg-forest-100 text-forest-700"
                          : "bg-sage-50 text-sage-500"
                      }`}
                    >
                      <SectionIcon section={s.type} size={21} />
                    </span>
                    {startedSection ? (
                      <span className="flex items-center gap-1 rounded-pill bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-forest-700">
                        <IconCheck size={11} /> {n} item{n === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span className="rounded-pill border border-dashed border-sage-300 px-2.5 py-0.5 text-xs text-sage-600">
                        Begin
                      </span>
                    )}
                  </div>
                  <CardTitle className="mt-4 flex items-center gap-1.5">
                    {s.label}
                    <IconArrowRight
                      size={15}
                      className="text-sage-400 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                    />
                  </CardTitle>
                  <CardDescription className="mt-1.5">{s.blurb}</CardDescription>
                </Card>
              </Link>
            );
          })}

          {/* Partner sharing slot completes the grid */}
          <Link href="/people">
            <Card
              interactive
              className="group h-full border-sage-200 bg-sage-50/70"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-flame-300/30 text-flame-600">
                <IconUsers size={21} />
              </span>
              <CardTitle className="mt-4 flex items-center gap-1.5">
                Share with your partner
                <IconArrowRight
                  size={15}
                  className="text-sage-400 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                />
              </CardTitle>
              <CardDescription className="mt-1.5">
                Invite someone you trust to co-view what you choose, today.
              </CardDescription>
            </Card>
          </Link>
        </div>
      </section>

      {/* ── Trust footer ───────────────────────────────────────────────── */}
      <section className="animate-rise rise-3 flex flex-col gap-3 rounded-card border border-canvas-300/70 bg-canvas-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-100 text-forest-600">
            <IconShield size={17} />
          </span>
          <p className="text-sm text-ink-600">
            Everything here is encrypted before it’s stored, and nothing is ever
            released without a person reviewing the claim first.
          </p>
        </div>
        <Link
          href="/security"
          className="shrink-0 text-sm font-medium text-forest-700 hover:underline"
        >
          How release works →
        </Link>
      </section>
    </div>
  );
}
