import { NextRequest, NextResponse } from "next/server";

type TranslateRequestBody = {
  targetLang?: string;
  texts?: string[];
};

const SUPPORTED_LANGS = new Set(["vi", "en", "ja", "ko", "zh-CN"]);
const TRANSLATION_CACHE = new Map<string, string>();

function toGoogleTarget(lang: string): string {
  if (lang === "zh-CN") return "zh-CN";
  return lang;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || targetLang === "vi") return text;

  const cacheKey = `${targetLang}::${text}`;
  const cached = TRANSLATION_CACHE.get(cacheKey);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "auto");
    url.searchParams.set("tl", toGoogleTarget(targetLang));
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", text);

    const response = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) return text;

    const raw = await response.json();
    const translated = Array.isArray(raw?.[0])
      ? raw[0]
          .map((item: unknown) => (Array.isArray(item) ? (item[0] as string) : ""))
          .join("")
          .trim()
      : "";

    const finalValue = translated || text;
    TRANSLATION_CACHE.set(cacheKey, finalValue);
    return finalValue;
  } catch {
    return text;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TranslateRequestBody;
    const targetLang = normalizeText(body.targetLang || "vi");
    const rawTexts = Array.isArray(body.texts) ? body.texts : [];

    if (!SUPPORTED_LANGS.has(targetLang)) {
      return NextResponse.json({ translations: {} }, { status: 200 });
    }

    if (rawTexts.length === 0) {
      return NextResponse.json({ translations: {} }, { status: 200 });
    }

    const uniqueTexts = Array.from(
      new Set(
        rawTexts
          .map((value) => normalizeText(value))
          .filter((value) => value.length > 0)
      )
    ).slice(0, 300);

    const translatedPairs = await Promise.all(
      uniqueTexts.map(async (text) => [text, await translateText(text, targetLang)] as const)
    );

    const translations = Object.fromEntries(translatedPairs);
    return NextResponse.json({ translations }, { status: 200 });
  } catch {
    return NextResponse.json({ translations: {} }, { status: 200 });
  }
}
