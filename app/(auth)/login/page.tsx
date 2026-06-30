import Link from "next/link";
import { SignInForm } from "@/components/auth/AuthForms";
import { Button } from "@/components/ui/Button";
import { DEMO_MODE } from "@/lib/demo/config";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ "check-email"?: string }>;
}) {
  const params = await searchParams;
  return (
    <div>
      <h1 className="text-3xl font-display text-forest-800">Welcome back</h1>
      <p className="mt-1.5 mb-6 text-ink-500">
        Sign in to your calm, organised place.
      </p>
      {DEMO_MODE && (
        <div className="mb-6 rounded-card border border-flame-300/60 bg-flame-300/15 p-4">
          <p className="text-sm text-ink-600">
            This is a live demo with sample data. No password needed.
          </p>
          <Link href="/dashboard" className="mt-3 inline-block">
            <Button>Enter the demo</Button>
          </Link>
        </div>
      )}
      {params["check-email"] && (
        <p className="mb-5 rounded-2xl bg-sage-100 px-4 py-3 text-sm text-forest-800">
          Almost there. Check your email to confirm your account, then sign in.
        </p>
      )}
      <SignInForm />
    </div>
  );
}
