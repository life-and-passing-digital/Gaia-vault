"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { signOut } from "@/lib/auth/actions";
import {
  IconHome,
  IconShield,
  IconUsers,
  IconVault,
  type IconProps,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

const LINKS: { href: string; label: string; icon: (p: IconProps) => React.ReactNode }[] = [
  { href: "/dashboard", label: "Home", icon: IconHome },
  { href: "/vault", label: "My vault", icon: IconVault },
  { href: "/people", label: "People", icon: IconUsers },
];

/** Top navigation for the authenticated app, with active states. */
export function AppNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/vault" ? pathname.startsWith("/vault") : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-20 border-b border-canvas-300 bg-canvas-50/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-5 py-3">
        <Link href="/dashboard" className="shrink-0">
          <Logo />
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm transition-colors",
                isActive(href)
                  ? "bg-forest-100 font-medium text-forest-800"
                  : "text-ink-500 hover:bg-sage-100 hover:text-ink-700",
              )}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
              <span className="sr-only sm:hidden">{label}</span>
            </Link>
          ))}
          <Link
            href="/account"
            aria-current={pathname.startsWith("/account") ? "page" : undefined}
            className={cn(
              "rounded-pill px-3 py-1.5 text-sm transition-colors",
              pathname.startsWith("/account")
                ? "bg-forest-100 font-medium text-forest-800"
                : "text-ink-500 hover:bg-sage-100 hover:text-ink-700",
            )}
          >
            Account
          </Link>
          {isAdmin && (
            <Link
              href="/admin/claims"
              aria-current={pathname.startsWith("/admin") ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-forest-100 font-medium text-forest-800"
                  : "text-forest-700 hover:bg-sage-100",
              )}
            >
              <IconShield size={16} />
              <span className="hidden sm:inline">Admin</span>
              <span className="sr-only sm:hidden">Admin</span>
            </Link>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-pill px-3 py-1.5 text-sm text-ink-400 transition-colors hover:bg-sage-100 hover:text-ink-700"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
