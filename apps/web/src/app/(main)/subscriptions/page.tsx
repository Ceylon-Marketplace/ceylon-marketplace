"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { formatPrice } from "@/lib/utils";
import { Check } from "lucide-react";

export default function SubscriptionsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await api.get("/subscriptions/plans");
      return data;
    },
  });

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      await api.post(`/subscriptions/plans/${planId}/subscribe`);
      router.push("/dashboard");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Subscription failed");
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Choose Your Plan
        </h1>
        <p className="mt-2 text-gray-500">
          Subscribe to start listing items on Ceylon Marketplace.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-64 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-3">
          {plans?.map((plan: any, i: number) => (
            <div
              key={plan.id}
              className={`card flex flex-col p-6 ${
                i === 1 ? "ring-2 ring-brand-500 shadow-lg" : ""
              }`}
            >
              {i === 1 && (
                <span className="mb-3 self-start badge bg-brand-500 text-white">
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
              <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
              <div className="my-4">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(plan.price)}
                </span>
                <span className="text-sm text-gray-400">
                  /{plan.durationDays}d
                </span>
              </div>
              <ul className="flex-1 space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {plan.maxListings === 9999
                    ? "Unlimited listings"
                    : `Up to ${plan.maxListings} listings`}
                </li>
                {plan.featuredSlots > 0 && (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {plan.featuredSlots} featured listing
                    {plan.featuredSlots !== 1 ? "s" : ""}
                  </li>
                )}
                {plan.name === "Business" && (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Business storefront
                  </li>
                )}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                className={`mt-6 ${i === 1 ? "btn-primary" : "btn-secondary"}`}
              >
                Subscribe
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
