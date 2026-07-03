// Simple token-based auth for the admin panel.
//
// React Native analogy: instead of AsyncStorage we keep the token in a cookie.
// A cookie is automatically sent to the server on every request, so Next.js
// middleware (see src/middleware.ts) can read it and protect routes server-side.

export const TOKEN_KEY = "ramayan_admin_token";

// Dummy admin credentials. Replace this block with a real API call later.
const ADMIN = {
  email: "admin@ramayana.com",
  password: "password123",
};

/** Read the current token (client-side only). Returns null if signed out. */
export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(^| )${TOKEN_KEY}=([^;]+)`)
  );
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Sign in. Simulates an async network request like your RN API call.
 * Throws if the credentials are wrong so the UI can show an error.
 */
export async function login(email: string, password: string): Promise<void> {
  // Fake network delay so you can see the loading state.
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (email !== ADMIN.email || password !== ADMIN.password) {
    throw new Error("Invalid email or password");
  }

  const token = btoa(`${email}:${Date.now()}`);
  // max-age is in seconds -> 1 day. samesite=lax is a safe default.
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(
    token
  )}; path=/; max-age=${60 * 60 * 24}; samesite=lax`;
}

/** Sign out by clearing the token cookie. */
export function logout(): void {
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
}
