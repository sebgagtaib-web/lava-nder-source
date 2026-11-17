import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const accountSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  phone: z
    .string()
    .transform((s) => s.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^(?:\+213|0)\d{8,9}$/)),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(72),
  businessName: z.string().trim().max(120).optional(),
});
export type AccountInput = z.input<typeof accountSchema>;

async function createAccount(input: z.output<typeof accountSchema>, role: "admin" | "merchant") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { first_name: input.firstName, last_name: input.lastName },
  });
  if (error || !data.user) {
    const msg = error?.message ?? "";
    if (/already|registered|exists/i.test(msg)) throw new Error("EMAIL_TAKEN");
    throw new Error(msg || "SIGNUP_FAILED");
  }
  const userId = data.user.id;
  const { error: pErr } = await supabaseAdmin.from("profiles").insert({
    id: userId,
    first_name: input.firstName,
    last_name: input.lastName,
    phone: input.phone,
    email: input.email,
    business_name: input.businessName || null,
  });
  const { error: rErr } = pErr ? { error: pErr } : await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
  if (pErr || rErr) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error("SIGNUP_FAILED");
  }
  return { userId };
}

/** Public: merchants create their own account and can order right away. */
export const registerMerchant = createServerFn({ method: "POST" })
  .inputValidator((input: AccountInput) => accountSchema.parse(input))
  .handler(async ({ data }) => createAccount(data, "merchant"));

/** Public: tells the /admin page whether the owner account still needs to be created. */
export const getAdminSetupState = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return { hasAdmin: (count ?? 0) > 0 };
});

/** Public, one-time: creates the owner account only while no owner exists. */
export const createFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: AccountInput) => accountSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("ADMIN_EXISTS");
    return createAccount(data, "admin");
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("FORBIDDEN");
}

export const adminCreateMerchant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AccountInput) => accountSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    return createAccount(data, "merchant");
  });

export const adminDeleteMerchant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId);
    if ((roles ?? []).some((r) => r.role === "admin")) throw new Error("CANNOT_DELETE_ADMIN");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminResetMerchantPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; password: string }) =>
    z.object({ userId: z.string().uuid(), password: z.string().min(8).max(72) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
