"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag, Store } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { useAuthStore } from "@/store/auth.store";

type Role = "USER" | "SELLER";

const ROLES: {
  value: Role;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "USER",
    label: "I want to buy",
    description: "Browse, save, bid, and message sellers",
    icon: <ShoppingBag className="h-5 w-5" aria-hidden="true" />,
  },
  {
    value: "SELLER",
    label: "I want to sell",
    description: "List products and build your storefront",
    icon: <Store className="h-5 w-5" aria-hidden="true" />,
  },
];

const inputClassName =
  "block h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("USER");
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register({ ...form, role });
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <AuthShell
      variant="register"
      maxWidthClassName="max-w-[560px]"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-gray-950 underline decoration-gray-300 underline-offset-4 transition hover:decoration-brand-500"
          >
            Sign in
          </Link>
        </>
      }
    >
      <div className="max-w-lg">
        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-gray-950 sm:text-4xl">
          Create your account
        </h1>
        <p className="mt-2 text-base leading-6 text-gray-600">
          Join Ceylon to buy unique finds or start selling your own.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="mt-5 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <fieldset>
          <legend className="mb-2.5 text-sm font-medium text-gray-800">
            What brings you here?
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLES.map((option) => {
              const selected = role === option.value;

              return (
                <label
                  key={option.value}
                  className={`relative flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition active:scale-[0.99] ${
                    selected
                      ? "border-brand-500 bg-brand-50 shadow-[0_0_0_1px_rgba(232,76,61,0.12)]"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={selected}
                    onChange={() => setRole(option.value)}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      selected
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {option.icon}
                  </span>
                  <span className="min-w-0 pr-5">
                    <span className="block text-sm font-semibold text-gray-950">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-gray-500">
                      {option.description}
                    </span>
                  </span>
                  {selected && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-gray-800">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              type="text"
              value={form.firstName}
              onChange={set("firstName")}
              className={inputClassName}
              placeholder="Amal"
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-gray-800">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              type="text"
              value={form.lastName}
              onChange={set("lastName")}
              className={inputClassName}
              placeholder="Silva"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-800">
            Email address
          </label>
          <input
            id="email"
            name="email"
            autoComplete="email"
            type="email"
            value={form.email}
            onChange={set("email")}
            className={inputClassName}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <label htmlFor="password" className="text-sm font-medium text-gray-800">
              Password
            </label>
            <span className="text-xs text-gray-500">At least 8 characters</span>
          </div>
          <input
            id="password"
            name="password"
            autoComplete="new-password"
            type="password"
            value={form.password}
            onChange={set("password")}
            className={inputClassName}
            placeholder="Create a secure password"
            minLength={8}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-[0_12px_24px_-12px_rgba(232,76,61,0.8)] transition hover:bg-brand-600 active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading
            ? "Creating your account..."
            : role === "SELLER"
              ? "Start selling"
              : "Create account"}
        </button>

        <p className="text-center text-xs leading-5 text-gray-500">
          By continuing, you agree to Ceylon Marketplace&apos;s terms and privacy policy.
        </p>
      </form>
    </AuthShell>
  );
}
