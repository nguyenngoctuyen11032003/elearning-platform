import type { LanguageCode } from "./language-context";

const CLIENT_CACHE = new Map<string, string>();
const SKIP_KEY_PATTERN = /(^|_)(id|slug|code|url|uri|email|phone|token|avatar|thumbnail|image|createdat|updatedat)$/i;
const SKIP_VALUE_PATTERN = /^(https?:\/\/|\/|[A-Za-z0-9_-]{16,}|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i;

const LANGUAGE_TO_LOCALE: Record<LanguageCode, string> = {
  vi: "vi-VN",
  en: "en-US",
};

export function getLocaleByLanguage(language: LanguageCode): string {
  return LANGUAGE_TO_LOCALE[language] || "vi-VN";
}

export function getCurrentLanguage(): LanguageCode {
  if (typeof window === "undefined") return "vi";
  const raw = localStorage.getItem("ics_lang") as LanguageCode | null;
  return raw || "vi";
}

function shouldSkipByKey(key?: string): boolean {
  return !!key && SKIP_KEY_PATTERN.test(key);
}

function looksTranslatable(value: string): boolean {
  const text = value.trim();
  if (!text) return false;
  if (text.length < 2) return false;
  if (SKIP_VALUE_PATTERN.test(text)) return false;

  const hasLetters = /[A-Za-z\u00C0-\u024F\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/.test(text);
  const hasWhitespace = /\s/.test(text);

  if (!hasLetters) return false;
  if (!hasWhitespace && text.length < 6) return false;
  return true;
}

function collectTexts(input: unknown, bucket: Set<string>, parentKey?: string): void {
  if (typeof input === "string") {
    if (!shouldSkipByKey(parentKey) && looksTranslatable(input)) {
      bucket.add(input.trim());
    }
    return;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      collectTexts(item, bucket, parentKey);
    }
    return;
  }

  if (input && typeof input === "object") {
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      collectTexts(value, bucket, key);
    }
  }
}

function applyTranslations(input: unknown, map: Map<string, string>, parentKey?: string): unknown {
  if (typeof input === "string") {
    if (shouldSkipByKey(parentKey)) return input;
    const normalized = input.trim();
    if (!looksTranslatable(normalized)) return input;
    return map.get(normalized) ?? input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => applyTranslations(item, map, parentKey));
  }

  if (input && typeof input === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      output[key] = applyTranslations(value, map, key);
    }
    return output;
  }

  return input;
}

async function fetchTranslations(texts: string[], targetLang: LanguageCode): Promise<Record<string, string>> {
  if (texts.length === 0 || targetLang === "vi") return {};

  const uncachedTexts = texts.filter((text) => !CLIENT_CACHE.has(`${targetLang}::${text}`));

  if (uncachedTexts.length > 0) {
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetLang,
          texts: uncachedTexts,
        }),
      });

      if (response.ok) {
        const body = (await response.json()) as { translations?: Record<string, string> };
        const translations = body.translations || {};

        for (const [text, translated] of Object.entries(translations)) {
          CLIENT_CACHE.set(`${targetLang}::${text}`, translated || text);
        }
      }
    } catch {
      // Keep original text when translation API is unavailable.
    }
  }

  const output: Record<string, string> = {};
  for (const text of texts) {
    output[text] = CLIENT_CACHE.get(`${targetLang}::${text}`) || text;
  }
  return output;
}

export async function autoTranslateData<T>(input: T, targetLang: LanguageCode): Promise<T> {
  if (!input || targetLang === "vi") return input;

  const textSet = new Set<string>();
  collectTexts(input, textSet);
  const texts = Array.from(textSet);

  if (texts.length === 0) return input;

  const translations = await fetchTranslations(texts, targetLang);
  const translationMap = new Map<string, string>(Object.entries(translations));

  return applyTranslations(input, translationMap) as T;
}
