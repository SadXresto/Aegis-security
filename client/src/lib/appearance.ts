/**
 * Appearance preferences (theme + language).
 *
 * The public Aegis site keeps its single designed theme; the workspace honours
 * the `dark` class, which is purely additive (see styles/aegis-app.css). The
 * choice is stored locally, so it never depends on the backend.
 */

export type ThemeChoice = "light" | "dark" | "system";

export type Appearance = {
  theme: ThemeChoice;
  language: string;
};

const THEME_KEY = "aegis.theme";
const LANGUAGE_KEY = "aegis.language";

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "es", label: "Español (Spanish)" },
  { value: "ar", label: "العربية (Arabic)" },
] as const;

const THEMES: ThemeChoice[] = ["light", "dark", "system"];

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — the choice simply won't persist */
  }
}

export function readAppearance(): Appearance {
  const theme = safeGet(THEME_KEY);
  const language = safeGet(LANGUAGE_KEY);
  return {
    theme: THEMES.includes(theme as ThemeChoice) ? (theme as ThemeChoice) : "light",
    language: LANGUAGES.some((item) => item.value === language) ? (language as string) : "en",
  };
}

let systemQuery: MediaQueryList | null = null;
let systemListener: ((event: MediaQueryListEvent) => void) | null = null;

function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  const prefersDark =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;

  root.classList.toggle("dark", choice === "dark" || (choice === "system" && prefersDark));

  if (systemQuery && systemListener) {
    systemQuery.removeEventListener("change", systemListener);
    systemQuery = null;
    systemListener = null;
  }

  if (choice === "system" && typeof window !== "undefined" && typeof window.matchMedia === "function") {
    systemQuery = window.matchMedia("(prefers-color-scheme: dark)");
    systemListener = (event) => {
      document.documentElement.classList.toggle("dark", event.matches);
    };
    systemQuery.addEventListener("change", systemListener);
  }
}

export function applyAppearance(appearance: Appearance): void {
  applyTheme(appearance.theme);
  document.documentElement.lang = appearance.language;
}

export function saveAppearance(appearance: Appearance): Appearance {
  safeSet(THEME_KEY, appearance.theme);
  safeSet(LANGUAGE_KEY, appearance.language);
  applyAppearance(appearance);
  return appearance;
}

/** Applied once at startup so the stored preference survives reloads. */
export function applyStoredAppearance(): void {
  applyAppearance(readAppearance());
}
