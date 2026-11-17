export function formatDZD(value: number | string | null | undefined, lang: string = "ar") {
  const n = Number(value ?? 0);
  const locale = lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-DZ" : "en-US";
  const num = new Intl.NumberFormat(locale === "ar-DZ" ? "fr-DZ" : locale, { maximumFractionDigits: 0 }).format(n);
  return lang === "ar" ? `${num} د.ج` : `${num} DA`;
}

export function formatDate(value: string | Date, lang: string = "ar") {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
