import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { LayoutDashboard, ClipboardList, CalendarDays, Settings, LogOut, Loader2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth({ redirectOnUnauthenticated: true });
  const [location, navigate] = useLocation();
  const utils = trpc.useUtils();

  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: async () => {
      await utils.adminAuth.me.invalidate();
      navigate("/admin/login");
    },
  });

  if (loading || !admin) {
    return (
      <div className="admin-ui min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const isActive = (href: string) => location.startsWith(href);

  return (
    <div className="admin-ui min-h-screen bg-background text-neutral-900">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col border-r border-neutral-200 bg-white">
        <div className="px-5 pt-5 pb-4">
          <Link href="/admin/dashboard" className="block">
            <img src="/logo.webp" alt="Joyous JellyArt" className="h-7 w-auto" />
          </Link>
          <p className="text-xs text-neutral-500 mt-1.5">Admin</p>
        </div>
        <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 h-9 px-3 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-neutral-100 text-neutral-900 font-medium"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                <item.icon className={`h-4 w-4 ${active ? "text-primary" : "text-neutral-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-neutral-200 px-3 py-3">
          <div className="flex items-center justify-between gap-2 px-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{admin.name || admin.email}</p>
              {admin.name && <p className="text-xs text-neutral-500 truncate">{admin.email}</p>}
            </div>
            <button
              type="button"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              aria-label="Log out"
              title="Log out"
              className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200 bg-white/95 px-4 backdrop-blur">
        <Link href="/admin/dashboard">
          <img src="/logo.webp" alt="Joyous JellyArt" className="h-6 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          aria-label="Log out"
          className="h-9 w-9 inline-flex items-center justify-center rounded-md text-neutral-500 active:bg-neutral-100"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </header>

      <main className="md:pl-60">
        <div className="mx-auto w-full max-w-5xl px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-12">{children}</div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-4 border-t border-neutral-200 bg-white/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                active ? "text-primary" : "text-neutral-500"
              }`}
            >
              <item.icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
