import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { TierTag } from "@/components/ui/TierTag";
import { SecureBadge } from "@/components/ui/SecureBadge";
import { ItemEditor } from "@/components/vault/ItemEditor";
import { SectionIcon } from "@/components/vault/sectionIcons";
import { IconCheck, IconClock } from "@/components/ui/icons";
import { SECTIONS, SECTION_BY_TYPE } from "@/lib/vault/sections";
import { listSectionItems } from "@/lib/vault/actions";
import type { SectionType } from "@/lib/db/types";

const VALID = new Set<SectionType>([
  "wishes",
  "people",
  "documents",
  "assets",
  "messages",
]);

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "a month ago" : `${months} months ago`;
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!VALID.has(section as SectionType)) notFound();
  const sectionType = section as SectionType;
  const meta = SECTION_BY_TYPE[sectionType];
  const items = await listSectionItems(sectionType);
  const idx = SECTIONS.findIndex((s) => s.type === sectionType);
  const next = SECTIONS[idx + 1];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="animate-rise">
        <div className="flex items-center gap-4">
          <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-forest-100 p-3 text-forest-700">
            <SectionIcon section={sectionType} size={24} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-display text-forest-800">{meta.label}</h1>
              <SecureBadge />
            </div>
            <p className="mt-0.5 text-ink-500">{meta.prompt}</p>
          </div>
        </div>
      </div>

      {/* ── Items ──────────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <div className="animate-rise rise-1 rounded-card border border-dashed border-sage-300 bg-sage-50/60 p-6 sm:p-8">
          <h2 className="text-lg font-display text-forest-800">
            Nothing here yet, and that’s okay.
          </h2>
          <p className="mt-1 mb-5 max-w-md text-sm text-ink-500">{meta.blurb} Tap an idea below, or start with your own.</p>
          <ItemEditor section={sectionType} suggestions={meta.suggestions} />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="animate-rise rise-1 flex items-center gap-2 text-sm text-sage-700">
            <IconCheck size={15} className="text-forest-600" />
            {meta.encouragement}
          </p>
          <div className="animate-rise rise-1 space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="transition-shadow hover:shadow-lift">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium text-forest-800">{item.title}</h3>
                    {item.body && (
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">
                        {item.body}
                      </p>
                    )}
                    <p className="mt-2.5 flex items-center gap-1.5 text-xs text-ink-300">
                      <IconClock size={12} /> Updated {timeAgo(item.updatedAt)}
                    </p>
                  </div>
                  <TierTag tier={item.releaseTier} className="shrink-0" />
                </div>
              </Card>
            ))}
          </div>
          <div className="animate-rise rise-2">
            <ItemEditor
              section={sectionType}
              suggestions={meta.suggestions}
              usedTitles={items.map((i) => i.title)}
            />
          </div>
        </div>
      )}

      {/* ── Continue the journey ───────────────────────────────────────── */}
      {next && items.length > 0 && (
        <Link href={`/vault/${next.type}`} className="block">
          <div className="animate-rise rise-3 group flex items-center justify-between rounded-card border border-canvas-300/80 bg-canvas-50 px-6 py-4 shadow-soft transition-shadow hover:shadow-lift">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-50 text-sage-600">
                <SectionIcon section={next.type} size={19} />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-sage-600">
                  When you’re ready
                </p>
                <p className="font-medium text-forest-800">
                  Continue to {next.label}
                </p>
              </div>
            </div>
            <span className="text-sage-500 transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
