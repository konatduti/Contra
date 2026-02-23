"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Role = "user" | "admin";

type RoleContextValue = {
  role: Role;
  setRole: (role: Role) => void;
  toggleRole: () => void;
};

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

const STORAGE_KEY = "contra-role";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("user");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "admin" || stored === "user") {
      setRoleState(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, role);
  }, [role]);

  const setRole = useCallback((nextRole: Role) => {
    setRoleState(nextRole);
  }, []);

  const toggleRole = useCallback(() => {
    setRoleState((prev) => (prev === "admin" ? "user" : "admin"));
  }, []);

  const value = useMemo(
    () => ({
      role,
      setRole,
      toggleRole
    }),
    [role, setRole, toggleRole]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return ctx;
}
