import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { signOut } from "@/lib/auth/actions";

const LINKS = [
  { href: "/dashboard", label: "Home" },
  { href: "/vault", label: "My vault" },
  { href: "/people", label: "People" },
  { href: "/account", label: "Account" },
];

/** Top navigation for the authenticated app. */
export function AppNav({ isAdmin }: { isAdmin?: boolean }) {
  return (
    <header className="border-b border-canvas-300 bg-canvas-50/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-pill px-3 py-1.5 text-sm text-ink-700 hover:bg-sage-100"
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin/claims"
              className="rounded-pill px-3 py-1.5 text-sm text-forest-700 hover:bg-sage-100"
            >
              Admin
            </Link>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-pill px-3 py-1.5 text-sm text-ink-500 hover:bg-sage-100"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
