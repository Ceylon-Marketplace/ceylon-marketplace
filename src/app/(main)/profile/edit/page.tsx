"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { User, MapPin, Phone, FileText, ChevronLeft } from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, fetchMe, hasHydrated } = useAuthStore();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    phone: "",
    location: "",
    avatar: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setForm({
      firstName: user.profile?.firstName ?? "",
      lastName: user.profile?.lastName ?? "",
      bio: user.profile?.bio ?? "",
      phone: user.profile?.phone ?? "",
      location: user.profile?.location ?? "",
      avatar: user.profile?.avatar ?? "",
    });
  }, [hasHydrated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await api.patch("/users/me/profile", form);
      await fetchMe();
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (!hasHydrated || !user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
            Profile updated successfully!
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              First Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
                className="input pl-9"
                placeholder="First name"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) =>
                setForm((f) => ({ ...f, lastName: e.target.value }))
              }
              className="input"
              placeholder="Last name"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Bio
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className="input min-h-[100px] pl-9 pt-2"
              placeholder="Tell buyers about yourself..."
              maxLength={500}
            />
          </div>
          <p className="mt-1 text-right text-xs text-gray-400">
            {form.bio.length}/500
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              className="input pl-9"
              placeholder="+94 XX XXX XXXX"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              className="input pl-9"
              placeholder="e.g. Colombo, Sri Lanka"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Avatar URL
          </label>
          <input
            type="url"
            value={form.avatar}
            onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
            className="input"
            placeholder="https://..."
          />
          <p className="mt-1 text-xs text-gray-400">
            Paste a direct image URL for your profile photo
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
