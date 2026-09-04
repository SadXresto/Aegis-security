// Signal & Shield reminder: preserve the existing Aegis shell while adding clear, crawlable learning routes.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Article from "./pages/Article";
import Home from "./pages/Home";
import Learn from "./pages/Learn";

function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const page = path === "/learn" ? <Learn /> : path === "/learn/what-is-cybersecurity" ? <Article /> : <Home />;

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
