"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/AdminGuard";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { Background } from "@/components/Background";
import { MobileNav, SidebarNav } from "@/components/SidebarNav";
import { useAuth } from "@/hooks/useAuth";

const SIDEBAR_COLLAPSED_KEY = "ramayan-admin:sidebar-collapsed";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const isDashboardHome = pathname === "/dashboard";
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const displayName = user?.name || user?.email || "Admin";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Background className="flex h-dvh max-h-dvh overflow-hidden">
      {/* Sidebar: expands to labels, shrinks to icons-only */}
      <aside
        className={`hidden h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-white/5 bg-black/20 md:flex ${
          hydrated ? "transition-[width] duration-200 ease-out" : ""
        } ${
          hydrated && collapsed ? "w-[4.25rem]" : "w-56 lg:w-60"
        }`}
      >
        <div
          className={`flex shrink-0 items-center gap-2 ${
            collapsed
              ? "flex-col px-2 pt-4 pb-2"
              : "justify-between px-3 pt-5 pb-2 lg:px-4 lg:pt-6"
          }`}
        >
          <div
            className={`min-w-0 overflow-hidden ${
              collapsed ? "flex justify-center [&_img]:h-8 [&_img]:w-auto" : ""
            }`}
          >
            <Logo size="sm" />
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] transition hover:bg-white/5 hover:text-white"
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        </div>

        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 ${
            collapsed ? "px-1.5" : "px-2.5 lg:px-3 lg:py-4"
          }`}
        >
          {/* Avoid flash of wrong width labels before localStorage hydrate */}
          <SidebarNav collapsed={hydrated ? collapsed : false} />
        </div>

        <div
          className={`shrink-0 border-t border-white/5 py-3 ${
            collapsed ? "px-1.5" : "px-2.5 lg:px-3 lg:py-4"
          }`}
        >
          <LogoutButton
            className="w-full"
            collapsed={hydrated ? collapsed : false}
          />
        </div>
      </aside>

      {/* Main column: optional dashboard header + nav; only <main> scrolls */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {isDashboardHome ? (
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/5 px-2.5 py-2 sm:gap-3 sm:px-5 sm:py-3.5 lg:px-6 lg:py-4">
            <div className="md:hidden [&_img]:h-8 [&_img]:w-auto">
              <Logo size="sm" />
            </div>
            <h1 className="min-w-0 flex-1 truncate text-center text-base font-semibold tracking-[-0.01em] sm:text-lg md:flex-none md:text-left md:text-xl">
              Admin Panel
            </h1>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <span className="hidden max-w-[9rem] truncate text-sm tracking-wide text-[var(--text-muted)] sm:block md:max-w-[11rem] lg:max-w-xs">
                {isLoading ? "…" : user?.email ?? ""}
              </span>
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-sm font-semibold text-[var(--gold)] sm:size-9 sm:text-base">
                {initial}
              </div>
            </div>
          </header>
        ) : (
          <header className="flex shrink-0 items-center border-b border-white/5 px-2.5 py-2 md:hidden sm:px-5">
            <div className="[&_img]:h-8 [&_img]:w-auto">
              <Logo size="sm" />
            </div>
          </header>
        )}

        <MobileNav />

        <main
          className={
            isDashboardHome
              ? "flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain p-2.5 sm:p-5 lg:p-6"
              : "flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain p-2.5 sm:p-4 lg:p-5"
          }
        >
          <AdminGuard>{children}</AdminGuard>
        </main>

        <div className="shrink-0 border-t border-white/5 px-2.5 py-2.5 sm:p-4 md:hidden">
          <LogoutButton className="w-full" />
        </div>
      </div>
    </Background>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {collapsed ? (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="9" y1="4" x2="9" y2="20" />
          <polyline points="14 9 17 12 14 15" />
        </>
      ) : (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="9" y1="4" x2="9" y2="20" />
          <polyline points="15 9 12 12 15 15" />
        </>
      )}
    </svg>
  );
}
