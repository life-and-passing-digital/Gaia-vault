"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, verifyMfa, type AuthState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { REGIONS } from "@/lib/regions/config";

function FormError({ state }: { state: AuthState }) {
  if (!state?.error) return null;
  return (
    <p
      role="alert"
      className="rounded-2xl bg-[var(--color-danger)]/10 px-4 py-2.5 text-sm text-[var(--color-danger)]"
    >
      {state.error}
    </p>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <form action={action} className="space-y-4">
      <FormError state={state} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-ink-500">
        New here?{" "}
        <Link href="/signup" className="text-forest-700 underline">
          Create your vault
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, undefined);
  const liveRegions = Object.values(REGIONS).filter((r) => r.enabled);
  return (
    <form action={action} className="space-y-4">
      <FormError state={state} />
      <Field label="Your name" htmlFor="fullName">
        <Input id="fullName" name="fullName" autoComplete="name" />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field
        label="Create a password"
        htmlFor="password"
        hint="At least 10 characters. A passphrase you’ll remember is perfect."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>
      <Field
        label="Where should we store your data?"
        htmlFor="region"
        hint="Your data stays in this region. More regions are coming."
      >
        <select
          id="region"
          name="region"
          defaultValue="au"
          className="w-full rounded-2xl border border-canvas-400 bg-canvas-50 px-4 py-2.5"
        >
          {liveRegions.map((r) => (
            <option key={r.code} value={r.code}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating your vault…" : "Create my vault"}
      </Button>
      <p className="text-center text-xs text-ink-400">
        By continuing you agree we’ll store your information securely as described
        in our{" "}
        <Link href="/security" className="underline">
          security page
        </Link>
        .
      </p>
    </form>
  );
}

export function MfaForm() {
  const [state, action, pending] = useActionState(verifyMfa, undefined);
  return (
    <form action={action} className="space-y-4">
      <FormError state={state} />
      <Field
        label="Authentication code"
        htmlFor="code"
        hint="Enter the 6-digit code from your authenticator app."
      >
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          required
        />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Verifying…" : "Verify"}
      </Button>
    </form>
  );
}
