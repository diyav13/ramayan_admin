"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`flex items-center gap-2 rounded px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-white/5 hover:text-white ${className}`}
    >
      <LogoutIcon />
      Sign out
    </button>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
