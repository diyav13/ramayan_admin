"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { Background } from "@/components/Background";
import { SidebarNav } from "@/components/SidebarNav";
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
    <Background className="flex">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-white/5 bg-black/20 p-6 md:flex">
        <Logo size="sm" />
        <SidebarNav />
        <LogoutButton className="mt-auto" />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div className="md:hidden">
            <Logo size="sm" />
          </div>
          <h1 className="font-serif text-lg">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[var(--text-muted)] sm:block">
              {isLoading ? "…" : user?.email ?? ""}
            </span>
            <div className="flex size-9 items-center justify-center rounded-full bg-[var(--surface)] text-sm font-bold text-[var(--gold)]">
              {initial}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          <AdminGuard>{children}</AdminGuard>
        </main>
      </div>
    </Background>
  );
}
