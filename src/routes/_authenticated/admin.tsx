import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة المالك — Lava Nder لافاندر" },
      { name: "description", content: "إدارة الطلبات والمنتجات والتجار وأسعار التوصيل." },
      { property: "og:title", content: "لوحة المالك — Lava Nder لافاندر" },
      { property: "og:description", content: "إدارة المتجر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
});
