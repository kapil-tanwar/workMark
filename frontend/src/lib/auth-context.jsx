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
      localStorage.removeItem("wf_user");
      return;
    }
    try {
      const u = await api.fetchMe();
      setUser(u);
      localStorage.setItem("wf_user", JSON.stringify(u));
      await refreshStore(u);
    } catch {
      api.setToken(null);
      setUser(null);
      localStorage.removeItem("wf_user");
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
        localStorage.setItem("wf_user", JSON.stringify(u));
        await refreshStore(u);
        return u;
      },
      signup: async (input) => {
        const employeeId = validateEmployeeId(input.employeeId);
        const result = await api.signup({
          name: input.name,
          email: input.email?.trim() || "",
          password: input.password,
          role: input.role,
          employeeId,
          phone: input.phone.trim(),
        });
        if (result.pending) return result;
        const u = result.user;
        setUser(u);
        localStorage.setItem("wf_user", JSON.stringify(u));
        await refreshStore(u);
        return u;
      },
      logout: () => {
        api.setToken(null);
        setUser(null);
        localStorage.removeItem("wf_user");
      },
      updateProfile: async (input) => {
        const u = await api.updateProfile(input);
        setUser(u);
        localStorage.setItem("wf_user", JSON.stringify(u));
        await refreshStore(u);
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
