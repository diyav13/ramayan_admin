"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Chapters", href: "/dashboard/chapters" },
  { label: "Episodes", href: "/dashboard/episodes" },
  { label: "Quizzes", href: "/dashboard/quizzes" },
  { label: "Information", href: "/dashboard/information" },
  { label: "Users", href: "/dashboard/users" },
  { label: "Settings", href: "#" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-10 space-y-1">
      {navItems.map((item) => {
        const active = item.href !== "#" && pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`block rounded px-3 py-2.5 text-sm transition ${
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
