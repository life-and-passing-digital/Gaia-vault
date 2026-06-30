import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { FLAGS } from "@/lib/flags";

export const metadata = { title: "Passwords & credentials" };

// LEGAL-GATE: financial credentials require GLBA + computer-misuse legal opinion
// before enabling. This screen renders the disabled state — never a fake form.
export default async function CredentialsPage() {
  await requireUser();
  const enabled = FLAGS.credentials;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-display text-forest-800">
        Passwords &amp; credentials
      </h1>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Securely store account credentials</CardTitle>
          <span className="rounded-pill bg-flame-300/30 px-3 py-1 text-xs font-medium text-flame-600">
            Coming soon
          </span>
        </div>
        <CardDescription className="mt-3">
          We’re building a careful, secure way to store the credentials that
          matter — but we won’t turn it on until it has passed an independent
          security review and the right legal sign-offs. We’d rather wait than
          get this wrong.
        </CardDescription>
        <div className="mt-5">
          <Button disabled aria-disabled>
            {enabled ? "Add a credential" : "Pending security review"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
