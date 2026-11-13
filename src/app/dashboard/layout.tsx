"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { Background } from "@/components/Background";
import { MobileNav, SidebarNav } from "@/components/SidebarNav";
import { AdminCacheProvider } from "@/contexts/AdminCacheProvider";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  const displayName = user?.name || user?.email || "Admin";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <AdminCacheProvider>
      <Background className="flex h-dvh max-h-dvh overflow-hidden">
        {/* Sidebar: own height = viewport; nav scrolls; Sign out stays pinned */}
        <aside className="hidden h-full min-h-0 w-56 shrink-0 flex-col overflow-hidden border-r border-white/5 bg-black/20 md:flex lg:w-60">
          <div className="shrink-0 px-4 pt-5 pb-2 lg:px-5 lg:pt-6">
            <Logo size="sm" />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-3 lg:px-3 lg:py-4">
            <SidebarNav />
          </div>

          <div className="shrink-0 border-t border-white/5 px-2.5 py-3 lg:px-3 lg:py-4">
            <LogoutButton className="w-full" />
          </div>
        </aside>

        {/* Main column: header + nav fixed; only <main> scrolls with content */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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

          <MobileNav />

          <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-2.5 sm:p-5 lg:p-6">
            <AdminGuard>{children}</AdminGuard>
          </main>

          <div className="shrink-0 border-t border-white/5 px-2.5 py-2.5 sm:p-4 md:hidden">
            <LogoutButton className="w-full" />
          </div>
        </div>
      </Background>
    </AdminCacheProvider>
  );
}
