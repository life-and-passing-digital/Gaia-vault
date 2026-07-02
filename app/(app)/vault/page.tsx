import Link from "next/link";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { SectionIcon } from "@/components/vault/sectionIcons";
import { IconArrowRight, IconCheck } from "@/components/ui/icons";
import { SECTIONS } from "@/lib/vault/sections";
import { sectionCounts } from "@/lib/vault/actions";

export const metadata = { title: "My vault" };

export default async function VaultIndexPage() {
  const counts = await sectionCounts();

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <h1 className="text-3xl font-display text-forest-800">My vault</h1>
        <p className="mt-1 text-ink-500">
          Everything in one calm place. Choose a section to begin.
        </p>
      </div>
      <div className="animate-rise rise-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => {
          const n = counts[s.type] ?? 0;
          return (
            <Link key={s.type} href={`/vault/${s.type}`}>
              <Card interactive className="group h-full">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                      n > 0
                        ? "bg-forest-100 text-forest-700"
                        : "bg-sage-50 text-sage-500"
                    }`}
                  >
                    <SectionIcon section={s.type} size={21} />
                  </span>
                  {n > 0 ? (
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
      </div>
    </div>
  );
}
