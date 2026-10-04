// Signal & Shield reminder: preserve the existing Aegis shell while adding authenticated workspace routes.
import { type ReactElement } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Account from "./pages/Account";
import Article from "./pages/Article";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import Marketplace from "./pages/Marketplace";
import NotFound from "./pages/NotFound";
import Passwords from "./pages/Passwords";
import Projects from "./pages/Projects";
import Reports from "./pages/Reports";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import Services from "./pages/Services";
import Threats from "./pages/Threats";
import VerifyEmail from "./pages/VerifyEmail";

/** Public routes keep their existing behaviour; unknown paths fall back to the 404 page. */
const PUBLIC_ROUTES: Record<string, ReactElement> = {
  "/": <Home />,
  "/learn": <Learn />,
  "/learn/what-is-cybersecurity": <Article />,
  "/auth": <Auth />,
  // `/login` is an alias so links that expect a login path still land on the sign-in form.
  "/login": <Auth />,
  "/forgot-password": <ForgotPassword />,
  "/reset-password": <ResetPassword />,
  "/verify-email": <VerifyEmail />,
  "/services": <Services />,
  "/marketplace": <Marketplace />,
  "/404": <NotFound />,
};

/** Signed-in workspace pages. Each one is guarded and preserves the intended path. */
const PROTECTED_ROUTES: Record<string, ReactElement> = {
  "/dashboard": <Dashboard />,
  "/projects": <Projects />,
  "/reports": <Reports />,
  "/threats": <Threats />,
  "/passwords": <Passwords />,
  "/settings": <Settings />,
  "/account": <Account />,
};

function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  const protectedPage = PROTECTED_ROUTES[path];
  const page: ReactElement = protectedPage ? (
    <ProtectedRoute>{protectedPage}</ProtectedRoute>
  ) : (
    PUBLIC_ROUTES[path] ?? <NotFound />
  );

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {page}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
