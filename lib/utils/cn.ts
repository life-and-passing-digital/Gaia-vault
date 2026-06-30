/**
 * Tiny class-name joiner. Filters falsy values so conditional classes read
 * cleanly without pulling in a dependency.
 *
 *   cn("base", isActive && "active", error ? "border-danger" : null)
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
