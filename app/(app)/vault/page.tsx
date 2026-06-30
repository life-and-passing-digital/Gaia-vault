import Link from "next/link";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { SECTIONS } from "@/lib/vault/sections";

export const metadata = { title: "My vault" };

export default function VaultIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display text-forest-800">My vault</h1>
        <p className="mt-1 text-ink-500">
          Everything in one calm place. Choose a section to begin.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.type} href={`/vault/${s.type}`}>
            <Card interactive className="h-full">
              <CardTitle>{s.label}</CardTitle>
              <CardDescription className="mt-2">{s.blurb}</CardDescription>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
