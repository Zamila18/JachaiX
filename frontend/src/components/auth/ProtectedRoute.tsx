"use client";

import { useAuth } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "user" | "admin";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname ?? "/")}`);
      return;
    }

    if (requiredRole && role !== requiredRole) {
      router.replace(role === "admin" ? "/admin/dashboard" : "/user/dashboard");
    }
  }, [loading, isAuthenticated, role, requiredRole, router, pathname]);

  if (loading) {
    return (
      <div className="jxu-loading">
        <div className="jxu-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (requiredRole && role !== requiredRole) return null;

  return <>{children}</>;
}
