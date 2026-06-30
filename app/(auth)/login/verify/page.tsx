import { MfaForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Two-step verification" };

export default function VerifyPage() {
  return (
    <div>
      <h1 className="text-3xl font-display text-forest-800">One more step</h1>
      <p className="mt-1.5 mb-6 text-ink-500">
        For your security, enter the code from your authenticator app.
      </p>
      <MfaForm />
    </div>
  );
}
