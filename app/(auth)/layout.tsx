import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-canvas-100">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
        <Link href="/" className="mb-8 inline-flex">
          <Logo />
        </Link>
        {children}
      </div>
    </main>
  );
}
