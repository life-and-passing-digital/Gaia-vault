import { SignInForm } from "@/components/auth/AuthForms";

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
      {params["check-email"] && (
        <p className="mb-5 rounded-2xl bg-sage-100 px-4 py-3 text-sm text-forest-800">
          Almost there. Check your email to confirm your account, then sign in.
        </p>
      )}
      <SignInForm />
    </div>
  );
}
