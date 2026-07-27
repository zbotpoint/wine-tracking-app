# Wine Log

A wine-tracking app for a small group of friends. Log the wines you drink, browse and filter everyone's tastings, and see your stats (rating histogram, top country/region/varietal).

Built with Vite + React + TypeScript, Tailwind CSS v4 + shadcn/ui, TanStack Query, react-hook-form + zod, and Supabase (Postgres, Auth, Storage). All copy uses Canadian English.

## Data model

A **wine** (name, producer, vintage, country, region, subregion, varietals, colour) is separate from a **tasting** (date, rating, notes, location, vessel, temperature, price, photo). Drinking the same wine twice is one wine with two tastings — the UI shows a ×N badge and lists every tasting (including friends') on the wine's page.

Only the wine name is required; everything else is optional. Regions and subregions are user-addable lookups (case-insensitively unique, immutable once created). Region means the broad area (for Canada, the province); subregion means the most specific area the label names — the hierarchy between subregions (e.g. Twenty Mile Bench inside Niagara Peninsula) is deliberately not modelled. The UI is a single always-dark theme with bordeaux highlights.

Everyone can read everyone's logs; only the owner can write their own. Wines are communal: anyone's tasting can attach to an existing wine, and only its creator can edit its identity. Enforced by Postgres row-level security, not application code.

## One-time setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier).
2. **Link and push the schema** (requires the Supabase CLI):

   ```sh
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

   If the storage policies in the migration fail on a hosted project ("must be owner of table objects"), create the four `wine-photos` policies from the migration via Dashboard → Storage → Policies instead.
3. **Configure auth** in the Supabase dashboard:
   - Authentication → Sign In / Up: disable "Allow new users to sign up" (accounts are invite-only).
   - Authentication → URL Configuration: set the Site URL to your deployed URL (invite links redirect there).
4. **Environment**: copy `.env.example` to `.env.local` and fill in the project URL and anon key from Settings → API Keys.
5. **Deploy on Netlify**: connect the repo; `netlify.toml` covers the build. Set the two `VITE_*` env vars in Site settings.
6. **Invite your friends**: Dashboard → Authentication → Users → Invite user. On first visit they choose a display name and password at `/welcome`.

## Development

```sh
npm install
npm run dev      # local dev server (needs .env.local)
npm test         # unit tests (stats, filter schema)
npm run lint     # oxlint
npm run build    # type-check + production build
```

`src/types/database.types.ts` is hand-authored to match the migration. With Docker and the Supabase CLI installed you can regenerate it against a local stack:

```sh
supabase start
npm run gen:types
```

## Post-deploy verification (two test accounts A and B)

- B sees A's tastings and wines; B cannot update or delete A's tasting (0 rows affected).
- B logging a tasting against A's wine attaches to the same wine row; the wine page shows both ratings.
- Logging the same wine twice shows one wine with two tastings and a ×2 badge, not two wines.
- B cannot edit A's wine identity; adding region "rioja" when "Rioja" exists returns the existing region.
- B can view A's photo via a signed URL but cannot upload into A's storage folder.
