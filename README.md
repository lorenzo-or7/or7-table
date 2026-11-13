# Or7 Table

**Premium digital menus for restaurants, by Or7.dev.**

Or7 Table is a digital menu platform with distinctive restaurant experiences, QR access, product and category management, owner dashboards, a central administration area and Supabase-backed authentication with TOTP MFA.

## Demo experiences

- **Casa Maré** — seafood-inspired menu
- **La Brasa** — street burger menu
- **Starbucks** — independent, unofficial conceptual demonstration; not affiliated with Starbucks

## Technology

React, TypeScript, Vite, Tailwind CSS, Motion and Supabase (Auth, Postgres, RLS, Storage, Edge Functions).

## Local development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

To validate:

```bash
npm run typecheck
npm run build
```

## Supabase configuration

See [PUBLICACAO.md](PUBLICACAO.md) for setup and deployment details. Configure the environment using `.env.example`; never commit private credentials. Apply migrations in order from `0001` to `0005`, after reviewing the final audit, and enable TOTP MFA.

**Current status:** production Supabase integration and external email delivery still require real-environment validation.

## Security

- Administrative features require authenticated sessions with TOTP MFA (AAL2).
- Restaurant data is isolated with Postgres RLS.
- Supabase secret/service-role keys must never be exposed in client code.

## Ownership

© 2026 Or7.dev. All rights reserved.

Source code is publicly viewable. No open-source license is granted. Third-party brand assets and trademarks remain property of their respective owners.
