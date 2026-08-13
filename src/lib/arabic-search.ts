export function normalizeArabicForSearch(value: string | undefined | null): string {
  return (value ?? "")
    .normalize("NFKD")
    // Arabic tashkeel, tatweel, Quranic marks and zero-width characters.
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u200C\u200D\uFEFF]/g, "")
    // Treat all common alef forms as one character.
    .replace(/[أإآٱ]/g, "ا")
    // Treat alef maksura and yeh as equivalent.
    .replace(/[ى]/g, "ي")
    // Normalise Arabic and Latin text spacing/case for forgiving search.
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function includesNormalizedArabic(source: string | undefined | null, query: string): boolean {
  const normalizedQuery = normalizeArabicForSearch(query);
  if (!normalizedQuery) return true;
  return normalizeArabicForSearch(source).includes(normalizedQuery);
}
