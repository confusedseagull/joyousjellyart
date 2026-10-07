import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { CartProvider } from "./contexts/CartContext";
import "./index.css";

// Client-side route changes (wouter's navigate()) don't reload the page, so
// without this the browser's native scroll restoration can re-impose the
// previous page's scroll offset after a route's own `window.scrollTo(0, 0)`
// already ran — e.g. landing on order confirmation still scrolled down from
// a long checkout form. Turning it off hands scroll position fully to the
// app, which is what each route's own scroll-to-top effect expects.
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

// A short staleTime lets screens revisited within a few seconds render from
// cache instantly instead of flashing a spinner; admin screens that must stay
// current also poll (see lib/adminLive.ts).
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000 } },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;
  if (window.location.pathname.startsWith("/admin")) {
    window.location.href = "/admin/login";
  }
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <App />
      </CartProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
