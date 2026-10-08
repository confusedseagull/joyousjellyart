import { useEffect } from "react";

type Tag = { tag: "link" | "meta"; attrs: Record<string, string> };

const ADMIN_TAGS: Tag[] = [
  { tag: "link", attrs: { rel: "manifest", href: "/admin-manifest.json" } },
  { tag: "link", attrs: { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" } },
  { tag: "meta", attrs: { name: "apple-mobile-web-app-capable", content: "yes" } },
  { tag: "meta", attrs: { name: "apple-mobile-web-app-status-bar-style", content: "default" } },
  { tag: "meta", attrs: { name: "apple-mobile-web-app-title", content: "JJA Admin" } },
  { tag: "meta", attrs: { name: "mobile-web-app-capable", content: "yes" } },
  { tag: "meta", attrs: { name: "theme-color", content: "#faf7f3" } },
];

// Same "Add to Home Screen" support for the storefront, but pointed at the
// brand's own icon/name instead of the admin dashboard's — swapped in
// whenever an admin route *isn't* active, so exactly one manifest is ever
// present at a time (see below).
const PUBLIC_TAGS: Tag[] = [
  { tag: "link", attrs: { rel: "manifest", href: "/manifest.json" } },
  { tag: "link", attrs: { rel: "apple-touch-icon", href: "/icons/site-apple-touch-icon.png" } },
  { tag: "meta", attrs: { name: "apple-mobile-web-app-capable", content: "yes" } },
  { tag: "meta", attrs: { name: "apple-mobile-web-app-status-bar-style", content: "default" } },
  { tag: "meta", attrs: { name: "apple-mobile-web-app-title", content: "Joyous JellyArt" } },
  { tag: "meta", attrs: { name: "mobile-web-app-capable", content: "yes" } },
  { tag: "meta", attrs: { name: "theme-color", content: "#faf7f3" } },
];

// Injects "Add to Home Screen" tags for whichever half of the app is active
// — the admin dashboard's own manifest/icon on an admin route, the
// storefront's on every other route — so pinning either one picks up the
// right name and icon instead of the browser falling back to a generated
// default (e.g. a plain letter icon).
export function useAdminPwaMeta(isAdminRoute: boolean) {
  useEffect(() => {
    const tags = isAdminRoute ? ADMIN_TAGS : PUBLIC_TAGS;
    const created: HTMLElement[] = [];
    for (const { tag, attrs } of tags) {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
      document.head.appendChild(el);
      created.push(el);
    }

    return () => {
      created.forEach((el) => el.remove());
    };
  }, [isAdminRoute]);
}
