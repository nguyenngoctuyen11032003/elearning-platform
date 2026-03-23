import type { LanguageCode } from "./language-context";
import vi from "./locales/vi.json";
import en from "./locales/en.json";

export const translations: Record<LanguageCode, Record<string, string>> = {
  vi,
  en,
};