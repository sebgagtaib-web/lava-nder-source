import { createFileRoute } from "@tanstack/react-router";

// Serves product photos from the private storage bucket so the shop can show them.
// Read-only and limited to the product photos bucket; nothing private is stored there.
const SAFE_PATH = /^[a-zA-Z0-9][a-zA-Z0-9/_.-]{0,200}$/;

export const Route = createFileRoute("/api/public/images/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat ?? "";
        if (!SAFE_PATH.test(path) || path.includes("..")) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("product-images").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, {
          headers: {
            "content-type": data.type || "image/jpeg",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
