import type { OrderStatus } from "@/components/StatusBadge";

export const STATUS_AR: Record<OrderStatus, string> = {
  pending: "جديد",
  confirmed: "مؤكَّد",
  shipped: "قيد التوصيل",
  delivered: "تم التسليم",
  cancelled: "ملغى",
  returned: "مُرتجَع",
};

export const CHANNEL_AR = { retail: "المتجر", wholesale: "الجملة" } as const;
export const DELIVERY_AR = { office: "للمكتب", home: "للمنزل" } as const;

export const dzd = (n: number | string | null | undefined) =>
  `${new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(Number(n ?? 0))} د.ج`;

export const dateAr = (v: string) =>
  new Intl.DateTimeFormat("ar-DZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v));

/** Turns server error codes into a sentence the owner understands. */
export function errorText(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e ?? "");
  if (msg.includes("EMAIL_TAKEN")) return "هذا البريد مسجّل مسبقاً.";
  if (msg.includes("ADMIN_EXISTS")) return "حساب المالك موجود مسبقاً، سجّل الدخول.";
  if (msg.includes("CANNOT_DELETE_ADMIN")) return "لا يمكن حذف حساب المالك.";
  if (msg.includes("FORBIDDEN")) return "ليست لديك صلاحية لهذا الإجراء.";
  if (/duplicate key|unique/i.test(msg)) return "هذه القيمة مستعملة مسبقاً.";
  return "حدث خطأ، حاول مرة أخرى.";
}
