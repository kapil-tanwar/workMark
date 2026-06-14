import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { validateEmployeeId } from "./auth-helpers";
import {
  clearAuthStorage,
  getStoredUser,
  isAuthenticated,
  setStoredUser,
} from "./auth-storage";
import * as api from "@/lib/api";
import { refreshStore } from "@/lib/store";

const AuthContext = createContext(null);

function readInitialUser() {
  if (typeof window === "undefined") return null;
  return getStoredUser();
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(readInitialUser);
  const [loading, setLoading] = useState(() => typeof window !== "undefined" && isAuthenticated());

  function applyUser(u) {
    const normalized = u ? api.normalizeUser(u) : null;
    setUserState(normalized);
    if (normalized) setStoredUser(normalized);
    else clearAuthStorage();
  }

  function persistSession(token, u) {
    api.setToken(token);
    applyUser(u);
  }

  const refresh = async () => {
    if (!api.getToken()) {
      applyUser(null);
      return;
    }
    try {
      const u = await api.fetchMe();
      applyUser(u);
      await refreshStore();
    } catch (err) {
      if (err?.status === 401) {
        api.setToken(null);
        applyUser(null);
      }
    }
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      login: async (identifier, password) => {
        const { user: u, token } = await api.login(identifier, password);
        persistSession(token, u);
        await refreshStore();
        return api.normalizeUser(u);
      },
      signup: async (input) => {
        const employeeId = validateEmployeeId(input.employeeId);
        const payload = {
          name: input.name,
          password: input.password,
          role: input.role,
          employeeId,
          phone: input.phone.trim(),
        };
        const trimmedEmail = input.email?.trim();
        if (trimmedEmail) payload.email = trimmedEmail;
        const { user: u, token } = await api.signup(payload);
        persistSession(token, u);
        await refreshStore();
        return api.normalizeUser(u);
      },
      logout: () => {
        api.setToken(null);
        applyUser(null);
      },
      updateProfile: async (input) => {
        const u = await api.updateProfile(input);
        applyUser(u);
        await refreshStore();
        return api.normalizeUser(u);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
