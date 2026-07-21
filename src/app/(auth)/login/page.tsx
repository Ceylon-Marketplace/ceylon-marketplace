"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { AuthShell } from "@/components/auth/auth-shell";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      const { user: loggedUser, mode: savedMode } = useAuthStore.getState();
      const isSeller =
        loggedUser?.role === "SELLER" || loggedUser?.role === "BUSINESS_SELLER";
      const redirectTo = searchParams.get("redirect");
      if (redirectTo) {
        router.push(redirectTo);
      } else if (isSeller && savedMode === null) {
        router.push("/mode-select");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <AuthShell
      variant="login"
      footer={
        <>
          New to Ceylon?{" "}
          <Link
            href="/register"
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            Create an account
          </Link>
        </>
      }
    >
      <h1 className="font-display text-2xl font-semibold text-ink-900">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-ink-600/70">
        Sign in to bid, buy, and manage your listings.
      </p>

      {error && (
        <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm text-brand-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-600/80">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-lg border border-brass-300/40 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder-ink-400/50 shadow-sm transition-colors focus:border-brass-600 focus:outline-none focus:ring-2 focus:ring-brass-300/50"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-600/80">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-lg border border-brass-300/40 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder-ink-400/50 shadow-sm transition-colors focus:border-brass-600 focus:outline-none focus:ring-2 focus:ring-brass-300/50"
            placeholder="••••••••"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-parchment-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
