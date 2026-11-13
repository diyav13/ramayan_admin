"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const DASHBOARD_NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Chapters", href: "/dashboard/chapters" },
  { label: "Episodes", href: "/dashboard/episodes" },
  { label: "Events", href: "/dashboard/events" },
  { label: "Quizzes", href: "/dashboard/quizzes" },
  { label: "Information", href: "/dashboard/information" },
  { label: "Avatars", href: "/dashboard/avatars" },
  { label: "Users", href: "/dashboard/users" },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-0.5" aria-label="Dashboard">
      {DASHBOARD_NAV.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`block rounded px-3 py-2.5 text-sm tracking-wide transition ${
              active
                ? "bg-[var(--gold)]/15 font-semibold text-[var(--gold)]"
                : "font-medium text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile"
      className="flex shrink-0 gap-1 overflow-x-auto overscroll-x-contain border-b border-white/5 px-2 py-1.5 sm:px-3 sm:py-2 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {DASHBOARD_NAV.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`shrink-0 rounded px-2.5 py-1 text-[11px] font-medium tracking-wide transition sm:px-3 sm:py-1.5 sm:text-xs ${
              active
                ? "bg-[var(--gold)]/15 font-semibold text-[var(--gold)]"
                : "text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
