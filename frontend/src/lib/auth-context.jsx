import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { validateEmployeeId } from "./auth-helpers";
import * as api from "@/lib/api";
import { refreshStore } from "@/lib/store";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!api.getToken()) {
      setUser(null);
      return;
    }
    try {
      const u = await api.fetchMe();
      setUser(u);
      await refreshStore();
    } catch {
      api.setToken(null);
      setUser(null);
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
        const { user: u } = await api.login(identifier, password);
        setUser(u);
        await refreshStore();
        return u;
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
        const { user: u } = await api.signup(payload);
        setUser(u);
        await refreshStore();
        return u;
      },
      logout: () => {
        api.setToken(null);
        setUser(null);
      },
      updateProfile: async (input) => {
        const u = await api.updateProfile(input);
        setUser(u);
        await refreshStore();
        return u;
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
