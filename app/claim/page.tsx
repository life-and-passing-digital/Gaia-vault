import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ClaimForm } from "@/components/claim/ClaimForm";

export const metadata = {
  title: "Notify us of a death",
  description:
    "If someone close to you has died and used Gaia Vault, you can notify us here. A real person will review your notification with care.",
};

export default function ClaimPage() {
  return (
    <main className="min-h-dvh bg-canvas-100">
      <header className="px-5 py-5">
        <div className="mx-auto max-w-2xl">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-5 pb-20">
        <h1 className="text-3xl font-display text-forest-800">
          We’re so sorry for your loss.
        </h1>
        <p className="mt-3 text-ink-600 leading-relaxed">
          If someone close to you used Gaia Vault, you can let us know here.
          You won’t be able to see any of their information, and neither can
          anyone else, until a member of our team has carefully reviewed your
          notification and the documents you provide. Take your time.
        </p>
        <div className="my-8 rounded-card border border-sage-200 bg-sage-50 p-4 text-sm text-forest-800">
          Nothing is released automatically. A person reviews every notification.
          Funeral wishes can be shared with an authorised funeral director soon
          after approval; financial and estate information waits until proof of
          legal authority is confirmed.
        </div>
        <ClaimForm />
      </div>
    </main>
  );
}
