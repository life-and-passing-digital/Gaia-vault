import Link from "next/link";
import { SignUpForm } from "@/components/auth/AuthForms";
import { Button } from "@/components/ui/Button";
import { DEMO_MODE } from "@/lib/demo/config";

export const metadata = { title: "Create your vault" };

export default function SignUpPage() {
  return (
    <div>
      <h1 className="text-3xl font-display text-forest-800">
        Let’s begin, gently.
      </h1>
      <p className="mt-1.5 mb-6 text-ink-500">
        Start with the easy things. You can add more whenever you’re ready.
      </p>
      {DEMO_MODE && (
        <div className="mb-6 rounded-card border border-flame-300/60 bg-flame-300/15 p-4">
          <p className="text-sm text-ink-600">
            This is a live demo with sample data. No sign-up needed.
          </p>
          <Link href="/dashboard" className="mt-3 inline-block">
            <Button>Enter the demo</Button>
          </Link>
        </div>
      )}
      <SignUpForm />
    </div>
  );
}
