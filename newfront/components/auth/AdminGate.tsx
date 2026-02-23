"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useRole } from "@/components/auth/RoleProvider";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (role !== "admin") {
      router.replace("/");
    }
  }, [role, router]);

  if (role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
