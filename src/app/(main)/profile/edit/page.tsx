"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Image as ImageIcon,
  Lock,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

type ProfileForm = {
  firstName: string;
  lastName: string;
  bio: string;
  phone: string;
  location: string;
  avatar: string;
};

const EMPTY_FORM: ProfileForm = {
  firstName: "",
  lastName: "",
  bio: "",
  phone: "",
  location: "",
  avatar: "",
};

const ROLE_LABELS: Record<string, string> = {
  USER: "Marketplace member",
  SELLER: "Marketplace seller",
  BUSINESS_SELLER: "Business seller",
};

export default function EditProfilePage() {
  const router = useRouter();
  const { user, fetchMe, hasHydrated } = useAuthStore();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [originalForm, setOriginalForm] = useState<ProfileForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent("/profile/edit")}`);
      return;
    }
    const profileForm = {
      firstName: user.profile?.firstName ?? "",
      lastName: user.profile?.lastName ?? "",
      bio: user.profile?.bio ?? "",
      phone: user.profile?.phone ?? "",
      location: user.profile?.location ?? "",
      avatar: user.profile?.avatar ?? "",
    };
    setForm(profileForm);
    setOriginalForm(profileForm);
  }, [hasHydrated, router, user]);

  useEffect(() => setAvatarError(false), [form.avatar]);

  const setField = (field: keyof ProfileForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError("");
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm);
  const fullName = `${form.firstName} ${form.lastName}`.trim() || "Marketplace member";
  const initials = `${form.firstName[0] ?? ""}${form.lastName[0] ?? ""}` || "M";
  const roleLabel = ROLE_LABELS[user?.role ?? ""] ?? "Marketplace member";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !isDirty) return;
    setSaving(true);
    setError("");
    try {
      await api.patch("/users/me/profile", form);
      await fetchMe();
      router.replace(`/profile/${user.id}`);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Your profile could not be saved. Please try again.");
      setSaving(false);
    }
  };

  if (!hasHydrated || !user) return <EditProfileSkeleton />;

  const publicProfileHref = `/profile/${user.id}`;

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <Link href={publicProfileHref} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-950">
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>

      <header className="border-b border-gray-200 pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Public identity</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-gray-950 sm:text-5xl">Edit your profile</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">Keep the details buyers and sellers use to recognize you accurate.</p>
      </header>

      {error && <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

      <form onSubmit={handleSubmit} className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-10">
          <EditSection icon={UserRound} title="Your public identity" description="Your name and image appear on your profile, listings, and marketplace activity.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name" required><input type="text" value={form.firstName} onChange={setField("firstName")} className="input h-12" autoComplete="given-name" required /></Field>
              <Field label="Last name" required><input type="text" value={form.lastName} onChange={setField("lastName")} className="input h-12" autoComplete="family-name" required /></Field>
            </div>
            <Field label="Profile image URL" hint="Use a direct HTTPS image link. Leave empty to show your initials.">
              <div className="relative"><ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="url" value={form.avatar} onChange={setField("avatar")} className="input h-12 pl-10" placeholder="https://example.com/profile.jpg" /></div>
            </Field>
          </EditSection>

          <EditSection icon={MapPin} title="About you" description="Add concise context that helps people understand who they are trading with.">
            <Field label="Location" hint="Shown publicly when provided.">
              <div className="relative"><MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="text" value={form.location} onChange={setField("location")} className="input h-12 pl-10" placeholder="Colombo, Sri Lanka" autoComplete="address-level2" /></div>
            </Field>
            <Field label="Bio" hint={`${form.bio.length}/500 characters`}>
              <textarea value={form.bio} onChange={setField("bio")} className="input min-h-[150px] resize-y py-3" placeholder="Tell marketplace members about your experience, interests, or the items you sell." maxLength={500} />
            </Field>
          </EditSection>

          <EditSection icon={Lock} title="Private contact details" description="These details support your account but are not shown on your public profile.">
            <Field label="Phone number" hint="Stored privately. Your verification status is shown publicly, not this number.">
              <div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="tel" value={form.phone} onChange={setField("phone")} className="input h-12 pl-10" placeholder="+94 XX XXX XXXX" autoComplete="tel" /></div>
            </Field>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600"><p className="font-medium text-gray-900">Account email</p><p className="mt-1 break-all">{user.email}</p><p className="mt-2 text-xs text-gray-500">Email changes are not available from this profile form.</p></div>
          </EditSection>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(17,24,39,0.06)]">
            <p className="text-sm font-semibold text-gray-950">Public preview</p>
            <p className="mt-1 text-xs text-gray-500">This is how your identity header will appear.</p>

            <div className="mt-5 border-t border-gray-200 pt-5">
              <div className="h-24 w-24 overflow-hidden rounded-2xl bg-gray-950">
                {form.avatar && !avatarError ? (
                  <img src={form.avatar} alt="Profile preview" className="h-full w-full object-cover" onError={() => setAvatarError(true)} />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl font-semibold uppercase text-white">{initials}</div>
                )}
              </div>
              {avatarError && <p className="mt-2 text-xs text-red-600">This image could not be loaded. Check the URL before saving.</p>}
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">{roleLabel}</p>
              <h2 className="mt-2 break-words text-2xl font-semibold tracking-[-0.035em] text-gray-950">{fullName}</h2>
              <p className="mt-3 flex items-center gap-2 text-xs font-medium text-brand-600"><ShieldCheck className="h-4 w-4" />{user.verificationLevel === "NONE" ? "Not verified" : `${user.verificationLevel.toLowerCase()} verified`}</p>
              {form.location && <p className="mt-3 flex items-start gap-2 text-sm text-gray-500"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{form.location}</p>}
              {form.bio && <p className="mt-4 line-clamp-4 text-sm leading-6 text-gray-600">{form.bio}</p>}
            </div>

            <div className="mt-6 space-y-3 border-t border-gray-200 pt-5">
              <button type="submit" disabled={saving || !isDirty || avatarError} className="btn-primary h-12 w-full gap-2 whitespace-nowrap disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save and view profile"}</button>
              <Link href={publicProfileHref} className="btn-secondary h-12 w-full">Cancel</Link>
            </div>
            <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-gray-500"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />{isDirty ? "You have unsaved changes." : "Your profile is up to date."}</div>
          </div>
        </aside>
      </form>
    </div>
  );
}

function EditSection({ icon: Icon, title, description, children }: { icon: typeof UserRound; title: string; description: string; children: React.ReactNode }) {
  return <section className="border-b border-gray-200 pb-10 last:border-b-0"><div className="mb-6 flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500"><Icon className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold text-gray-950">{title}</h2><p className="mt-1 text-sm leading-6 text-gray-500">{description}</p></div></div><div className="space-y-5 sm:pl-14">{children}</div></section>;
}

function Field({ label, required = false, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-gray-800">{label}{required && <span className="ml-1 text-brand-600">*</span>}</span>{children}{hint && <span className="mt-2 block text-xs leading-5 text-gray-500">{hint}</span>}</label>;
}

function EditProfileSkeleton() {
  return <div className="mx-auto max-w-6xl animate-pulse pb-12"><div className="h-5 w-32 rounded bg-gray-100" /><div className="mt-8 border-b border-gray-200 pb-7"><div className="h-3 w-28 rounded bg-gray-100" /><div className="mt-4 h-11 w-72 rounded bg-gray-100" /><div className="mt-4 h-4 max-w-lg rounded bg-gray-100" /></div><div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-10"><div className="h-64 rounded-2xl bg-gray-100" /><div className="h-72 rounded-2xl bg-gray-100" /><div className="h-56 rounded-2xl bg-gray-100" /></div><div className="hidden h-[520px] rounded-2xl bg-gray-100 lg:block" /></div></div>;
}
