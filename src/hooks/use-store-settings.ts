import { useLoaderData } from "@tanstack/react-router";

export function useStoreSettings() {
  return useLoaderData({ from: "__root__" });
}
