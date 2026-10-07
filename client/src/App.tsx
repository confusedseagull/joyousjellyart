import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import About from "./pages/About";
import Customize from "./pages/Customize";
import OrderConfirmation from "./pages/OrderConfirmation";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CNY2026 from "./pages/CNY2026";
import Cart from "./pages/Cart";
import { useAdminPwaMeta } from "./hooks/useAdminPwaMeta";

// Admin screens (and heavy deps like the revenue chart) load on demand, so
// the storefront never downloads them and the admin's first load is lighter.
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminSignup = lazy(() => import("./pages/AdminSignup"));
const AdminOrderDetail = lazy(() => import("./pages/AdminOrderDetail"));
const AdminDashboardOverview = lazy(() => import("./pages/admin/DashboardOverview"));
const AdminOrdersList = lazy(() => import("./pages/admin/OrdersList"));
const AdminCalendar = lazy(() => import("./pages/admin/Calendar"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));

function AdminPwaMeta() {
  const [location] = useLocation();
  useAdminPwaMeta(location.startsWith('/admin'));
  return null;
}

function HeaderWrapper() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith('/admin');
  return !isAdminRoute ? <Header /> : null;
}

function FooterWrapper() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith('/admin');
  return !isAdminRoute ? <Footer /> : null;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <>
      <AdminPwaMeta />
      <HeaderWrapper />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path="/discover" component={Discover} />
        <Route path="/about" component={About} />
        <Route path="/customize" component={Customize} />
        <Route path="/cny-2026" component={CNY2026} />
        <Route path="/cart" component={Cart} />
        <Route path="/order-confirmation" component={OrderConfirmation} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/signup" component={AdminSignup} />
        <Route path="/admin/dashboard" component={AdminDashboardOverview} />
        <Route path="/admin/orders/:id" component={AdminOrderDetail} />
        <Route path="/admin/orders" component={AdminOrdersList} />
        <Route path="/admin/calendar" component={AdminCalendar} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin" component={AdminDashboardOverview} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
      </Suspense>
      <FooterWrapper />
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
