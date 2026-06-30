import Link from "next/link";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
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

  return (
    <div className="space-y-8">
      <section className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <ProgressRing value={score} size={104} />
        <div>
          <h1 className="text-3xl font-display text-forest-800">
            Hello {firstName}.
          </h1>
          <p className="mt-1 max-w-prose text-ink-500">
            {score === 0
              ? "Let’s start with something easy. Your wishes are a gentle first step."
              : score < 100
                ? "You’re making lovely progress. A little at a time is just right."
                : "Everything’s in place. We’ll nudge you now and then to keep it current."}
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-sage-600">
          Your sections
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => {
            const n = counts[s.type] ?? 0;
            return (
              <Link key={s.type} href={`/vault/${s.type}`}>
                <Card interactive className="h-full">
                  <div className="flex items-center justify-between">
                    <CardTitle>{s.label}</CardTitle>
                    <span className="rounded-pill bg-sage-100 px-2.5 py-0.5 text-xs text-forest-700">
                      {n === 0 ? "Start" : `${n} item${n === 1 ? "" : "s"}`}
                    </span>
                  </div>
                  <CardDescription className="mt-2">{s.blurb}</CardDescription>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
