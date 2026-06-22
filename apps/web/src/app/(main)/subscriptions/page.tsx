"use client";

import Link from "next/link";
import { Clock } from "lucide-react";

export default function SubscriptionsPage() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <div className="mb-5 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Clock className="h-8 w-8 text-gray-400" />
        </div>
      </div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Coming soon</h1>
      <p className="mb-6 text-gray-500">
        Subscription plans are being set up. Listing is free while we get everything ready.
      </p>
      <Link href="/dashboard" className="btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
}
