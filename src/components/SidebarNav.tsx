"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

/**
 * Ordered for admin workflow:
 * content → story world → map → learning → people.
 */
export const DASHBOARD_NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: <IconDashboard /> }],
  },
  {
    label: "Content",
    items: [
      { label: "Chapters", href: "/dashboard/chapters", icon: <IconBook /> },
      { label: "Episodes", href: "/dashboard/episodes", icon: <IconPlay /> },
    ],
  },
  {
    label: "Story world",
    items: [
      { label: "Characters", href: "/dashboard/characters", icon: <IconAvatar /> },
      { label: "Locations", href: "/dashboard/locations", icon: <IconPin /> },
      { label: "Events", href: "/dashboard/events", icon: <IconCalendar /> },
      { label: "Story Map", href: "/dashboard/map", icon: <IconMap /> },
    ],
  },
  {
    label: "Learning",
    items: [
      { label: "Quizzes", href: "/dashboard/quizzes", icon: <IconQuiz /> },
      {
        label: "Quiz Instructions",
        href: "/dashboard/quiz-instructions",
        icon: <IconInfo />,
      },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Avatars", href: "/dashboard/avatars", icon: <IconFace /> },
      { label: "Users", href: "/dashboard/users", icon: <IconUsers /> },
    ],
  },
];

/** Flat list for mobile scroll nav (same order as sections). */
export const DASHBOARD_NAV: NavItem[] = DASHBOARD_NAV_SECTIONS.flatMap(
  (section) => section.items
);

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-4" aria-label="Dashboard">
      {DASHBOARD_NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          {!collapsed ? (
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]/70">
              {section.label}
            </p>
          ) : (
            <div
              className="mx-auto mb-1.5 h-px w-6 bg-white/10"
              aria-hidden
            />
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={`flex items-center gap-3 rounded transition ${
                    collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                  } ${
                    active
                      ? "bg-[var(--gold)]/15 font-semibold text-[var(--gold)]"
                      : "font-medium text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center ${
                      active ? "text-[var(--gold)]" : ""
                    }`}
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  {!collapsed ? (
                    <span className="truncate text-sm tracking-wide">
                      {item.label}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
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
            key={item.href}
            href={item.href}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium tracking-wide transition sm:px-3 sm:py-1.5 sm:text-xs ${
              active
                ? "bg-[var(--gold)]/15 font-semibold text-[var(--gold)]"
                : "text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="size-3.5 shrink-0" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function IconBase({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-full"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function IconDashboard() {
  return (
    <IconBase>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </IconBase>
  );
}

function IconBook() {
  return (
    <IconBase>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
    </IconBase>
  );
}

function IconPlay() {
  return (
    <IconBase>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m10 9 5 3-5 3V9z" />
    </IconBase>
  );
}

function IconCalendar() {
  return (
    <IconBase>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </IconBase>
  );
}

function IconQuiz() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </IconBase>
  );
}

function IconMap() {
  return (
    <IconBase>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </IconBase>
  );
}

function IconInfo() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </IconBase>
  );
}

function IconPin() {
  return (
    <IconBase>
      <path d="M12 22s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="11" r="2.5" />
    </IconBase>
  );
}

function IconAvatar() {
  return (
    <IconBase>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </IconBase>
  );
}

function IconFace() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </IconBase>
  );
}

function IconUsers() {
  return (
    <IconBase>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconBase>
  );
}
