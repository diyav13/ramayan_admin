"use client";

import { useRouter } from "next/navigation";
import {  useState } from "react";
import { Logo } from "@/components/Logo";
import { Background } from "@/components/Background";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAuthErrorMessage, useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e:any) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    try {
      await login({ email, password });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <Background className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Logo />

        <h1 className="mt-10 text-[22px] font-bold tracking-tight">
          Admin Sign In
        </h1>
        <p className="mt-2 text-sm text-[#a9a9a9]">
          Enter your admin email and password
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue="admin@ramayana.app"
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            defaultValue="Admin@123"
            required
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" disabled={loading} className="h-14 w-full">
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </div>
    </Background>
  );
}
