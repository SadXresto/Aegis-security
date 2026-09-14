// Signal & Shield reminder: preserve the existing Aegis shell while adding authenticated account routes.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Account from "./pages/Account";
import Article from "./pages/Article";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";

function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const page =
    path === "/learn"
      ? <Learn />
      : path === "/learn/what-is-cybersecurity"
        ? <Article />
        : path === "/auth"
          ? <Auth />
          : path === "/forgot-password"
            ? <ForgotPassword />
            : path === "/reset-password"
              ? <ResetPassword />
              : path === "/verify-email"
                ? <VerifyEmail />
                : path === "/account"
                  ? (
                    <ProtectedRoute>
                      <Account />
                    </ProtectedRoute>
                  )
                  : path === "/"
                    ? <Home />
                    : path === "/404"
                      ? <NotFound />
                      : // Unknown paths get the friendly 404 page.
                        <NotFound />;

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
