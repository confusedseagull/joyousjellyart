import { useEffect } from "react";

const TAGS: Array<{ tag: "link" | "meta"; attrs: Record<string, string> }> = [
  { tag: "link", attrs: { rel: "manifest", href: "/admin-manifest.json" } },
  { tag: "link", attrs: { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" } },
  { tag: "meta", attrs: { name: "apple-mobile-web-app-capable", content: "yes" } },
  { tag: "meta", attrs: { name: "apple-mobile-web-app-status-bar-style", content: "default" } },
  { tag: "meta", attrs: { name: "apple-mobile-web-app-title", content: "JJA Admin" } },
  { tag: "meta", attrs: { name: "mobile-web-app-capable", content: "yes" } },
  { tag: "meta", attrs: { name: "theme-color", content: "#6fa4a6" } },
];

// Injects PWA/"Add to Home Screen" tags only while an admin route is active,
// so the customer-facing storefront never offers to install as "JJA Admin".
export function useAdminPwaMeta(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const created: HTMLElement[] = [];
    for (const { tag, attrs } of TAGS) {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
      document.head.appendChild(el);
      created.push(el);
    }

    return () => {
      created.forEach((el) => el.remove());
    };
  }, [enabled]);
}
