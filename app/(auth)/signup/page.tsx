import { SignUpForm } from "@/components/auth/AuthForms";

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
      <SignUpForm />
    </div>
  );
}
