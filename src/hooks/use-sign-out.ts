import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/** Signs out, drops cached private data and replaces history so Back can't reopen the page. */
export function useSignOut(to: "/auth" | "/wholesale" | "/admin") {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to, replace: true });
  };
}
