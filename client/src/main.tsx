import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./contexts/AuthContext";
import { applyStoredAppearance } from "./lib/appearance";
import App from "./App";
import "./index.css";
import "./styles/aegis-app.css";

// Apply the saved theme/language before the first paint so there is no flash.
applyStoredAppearance();

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </AuthProvider>
);
