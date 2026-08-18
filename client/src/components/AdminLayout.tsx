import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-[#e5e5e5]">
        <SidebarHeader className="px-4 py-5">
          <Link href="/admin/dashboard">
            <span className="font-display text-xl text-foreground">Joyous JellyArt</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">Admin</p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = location.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} className="h-11 rounded-2xl text-[15px] data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-medium">
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-4 py-4 border-t border-[#e5e5e5]">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-foreground truncate">{admin.name || admin.email}</p>
            <button
              type="button"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#e5e5e5] md:hidden">
          <SidebarTrigger />
          <span className="font-display text-lg">Joyous JellyArt Admin</span>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
