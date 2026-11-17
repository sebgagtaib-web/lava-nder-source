import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Me = {
  userId: string;
  email: string | null;
  roles: string[];
  profile: { first_name: string; last_name: string; phone: string; is_active: boolean } | null;
} | null;

export async function fetchMe(): Promise<Me> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const [roles, profile] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("profiles").select("first_name, last_name, phone, is_active").eq("id", user.id).maybeSingle(),
  ]);
  return {
    userId: user.id,
    email: user.email ?? null,
    roles: (roles.data ?? []).map((r) => r.role),
    profile: profile.data,
  };
}

/** Current signed-in user with roles; only fetched in the browser. */
export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: fetchMe, staleTime: 60_000 });
}
