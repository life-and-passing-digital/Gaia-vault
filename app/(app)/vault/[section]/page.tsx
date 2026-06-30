import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { TierTag } from "@/components/ui/TierTag";
import { SecureBadge } from "@/components/ui/SecureBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemEditor } from "@/components/vault/ItemEditor";
import { SECTION_BY_TYPE } from "@/lib/vault/sections";
import { listSectionItems } from "@/lib/vault/actions";
import type { SectionType } from "@/lib/db/types";

const VALID = new Set<SectionType>([
  "wishes",
  "people",
  "documents",
  "assets",
  "messages",
]);

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

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-display text-forest-800">{meta.label}</h1>
          <SecureBadge />
        </div>
        <p className="mt-1 text-ink-500">{meta.prompt}</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={`Nothing here yet, and that’s okay`}
          description={meta.blurb}
          action={<ItemEditor section={sectionType} />}
        />
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-forest-800">{item.title}</h3>
                    {item.body && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600">
                        {item.body}
                      </p>
                    )}
                  </div>
                  <TierTag tier={item.releaseTier} />
                </div>
              </Card>
            ))}
          </div>
          <ItemEditor section={sectionType} />
        </div>
      )}
    </div>
  );
}
