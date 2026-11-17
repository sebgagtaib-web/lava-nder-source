<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Owner dashboard lives under `src/routes/_authenticated/admin*` with `AdminLayout` doing the admin role gate; it is Arabic-only and RTL (wrapped in Radix `DirectionProvider`). Why: only the owner uses it.
- Owner sign-in reuses `/auth`: when `redirect` starts with `/admin` it renders `OwnerAccess` (owner login, or one-time first-owner creation). Why: the managed auth gate always redirects to `/auth`.
- Admin CRUD goes through the browser client under admin RLS policies; only account creation/deletion/password reset use server functions. Why: those need the privileged auth API.
- Product photos are uploaded (shrunk to JPEG) to the private `product-images` bucket and stored in `products.images` as `/api/public/images/<path>` URLs. Why: public buckets are blocked for this workspace.
- Profit and revenue count delivered orders only and exclude delivery fees (`src/lib/pricing.ts`, `src/lib/reports.ts`).
