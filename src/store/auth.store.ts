import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: string;
  verificationLevel: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    phone?: string;
    location?: string;
  } | null;
  storefront?: { id: string; slug: string; name: string } | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  hasHydrated: boolean;
  mode: "buyer" | "seller" | null;
  setHasHydrated: () => void;
  setMode: (mode: "buyer" | "seller") => void;
  becomeSeller: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: "USER" | "SELLER";
  }) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      hasHydrated: false,
      mode: null,

      setHasHydrated: () => set({ hasHydrated: true }),

      setMode: (mode) => set({ mode }),

      becomeSeller: async () => {
        const { data } = await api.patch("/users/me/become-seller");
        set({ user: { ...get().user!, role: data.role }, mode: null });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/login", { email, password });
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          const isSeller =
            data.user.role === "SELLER" || data.user.role === "BUSINESS_SELLER";
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            // Buyers always get buyer mode; sellers keep their saved mode (null = prompt)
            mode: isSeller ? get().mode : "buyer",
          });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/register", formData);
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          const isSeller =
            data.user.role === "SELLER" || data.user.role === "BUSINESS_SELLER";
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            mode: isSeller ? null : "buyer",
          });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({ user: null, accessToken: null, refreshToken: null, mode: null });
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get("/auth/me");
          set({ user: data });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: "ceylon-auth",
      partialize: (s) => ({ user: s.user, mode: s.mode }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated?.();
      },
    },
  ),
);
