export const env = {
  isDev: process.env.NODE_ENV !== "production",
  apiBaseUrl: process.env.VITE_API_BASE_URL ?? "/api",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
};
