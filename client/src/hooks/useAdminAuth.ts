import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function useAdminAuth(options?: { redirectOnUnauthenticated?: boolean }) {
  const { redirectOnUnauthenticated = false } = options ?? {};
  const [location, navigate] = useLocation();

  const meQuery = trpc.adminAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const admin = meQuery.data ?? null;
  const loading = meQuery.isLoading;

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (admin) return;
    if (location === "/admin/login") return;

    navigate("/admin/login");
  }, [redirectOnUnauthenticated, loading, admin, location, navigate]);

  return { admin, loading };
}
