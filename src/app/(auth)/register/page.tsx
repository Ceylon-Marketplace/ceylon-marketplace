"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { ShoppingBag, Store, Check } from "lucide-react";

type Role = "USER" | "SELLER";

const ROLES: {
  value: Role;
  label: string;
  tagline: string;
  icon: React.ReactNode;
  perks: string[];
}[] = [
  {
    value: "USER",
    label: "Buyer",
    tagline: "I want to browse and buy",
    icon: <ShoppingBag className="h-7 w-7" />,
    perks: [
      "Browse thousands of listings",
      "Save favourites",
      "Make offers & place bids",
      "Message sellers directly",
    ],
  },
  {
    value: "SELLER",
    label: "Seller",
    tagline: "I want to list and sell",
    icon: <Store className="h-7 w-7" />,
    perks: [
      "Create and manage listings",
      "Run auctions",
      "Receive offers from buyers",
      "Build your storefront",
    ],
  },
];

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
        err?.response?.data?.message || "Registration failed. Please try again.",
      );
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-brand-600">
            Ceylon
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Create an account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Join Sri Lanka&apos;s premier marketplace
          </p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Role picker */}
          <fieldset className="mb-6">
            <legend className="mb-3 block text-sm font-medium text-gray-700">
              I want to…
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((r) => {
                const selected = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                      selected
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    {selected && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                    <span
                      className={`mb-2 block ${selected ? "text-brand-600" : "text-gray-400"}`}
                    >
                      {r.icon}
                    </span>
                    <span
                      className={`block text-sm font-semibold ${
                        selected ? "text-brand-700" : "text-gray-800"
                      }`}
                    >
                      {r.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {r.tagline}
                    </span>
                    <ul className="mt-3 space-y-1">
                      {r.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-1.5 text-xs text-gray-500">
                          <Check
                            className={`mt-0.5 h-3 w-3 shrink-0 ${
                              selected ? "text-brand-500" : "text-gray-300"
                            }`}
                          />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Account fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={set("firstName")}
                  className="input"
                  placeholder="Amal"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={set("lastName")}
                  className="input"
                  placeholder="Silva"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={set("password")}
                className="input"
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading
                ? "Creating account…"
                : role === "SELLER"
                  ? "Create seller account"
                  : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
