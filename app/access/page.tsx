import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Card } from "@/components/ui/Card";
import { TierTag } from "@/components/ui/TierTag";
import { getGrantedContent } from "@/lib/recipient/actions";

export const metadata = { title: "Shared with you", robots: { index: false } };

const REASONS: Record<string, string> = {
  not_found: "This link isn’t valid. Please check the link from your email.",
  expired: "This secure link has expired. If you need access again, please reply to the email you received.",
  revoked: "Access to this has been withdrawn.",
};

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = await getGrantedContent(token ?? "");

  return (
    <main className="min-h-dvh bg-canvas-100">
      <header className="px-5 py-5">
        <div className="mx-auto max-w-xl">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-xl px-5 pb-20">
        {!result.ok ? (
          <Card>
            <p className="text-ink-600">{REASONS[result.reason]}</p>
          </Card>
        ) : (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-display text-forest-800">
                Shared with you, with care
              </h1>
              <p className="mt-2 text-sm text-ink-500">
                Someone trusted you with this. This link is private to you and
                expires {new Date(result.expiresAt).toLocaleDateString()}.
              </p>
            </div>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-medium text-forest-800">{result.title}</h2>
                <TierTag tier={result.tier} />
              </div>
              {result.body && (
                <p className="mt-3 whitespace-pre-wrap text-ink-700">{result.body}</p>
              )}
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
