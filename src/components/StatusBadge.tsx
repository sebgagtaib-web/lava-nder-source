import { cn } from "@/lib/utils";

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const STYLES: Record<OrderStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/40",
  confirmed: "bg-accent text-primary border-primary/30",
  shipped: "bg-secondary text-secondary-foreground border-border",
  delivered: "bg-success/15 text-success border-success/40",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
  returned: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", STYLES[status])}>
      {label}
    </span>
  );
}
