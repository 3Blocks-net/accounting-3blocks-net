<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — Wallet Accounting Frontend

## Zweck

Internes Dashboard für das 3blocks Wallet Accounting. Visualisiert Transaktionen, Portfolio-Salden und Spam-Tokens, erlaubt manuelle Nachkorrektur und das Triggern von Syncs. Liest ausschließlich vom Backend (NestJS API), keine eigene Persistenz.

## Verwandte Repos

- **Backend (API):** `api-accounting-3blocks-net`
  - NestJS 11 + Prisma + PostgreSQL
  - Quelle aller Daten + alle Mutationen
  - Bei API-/Datenmodell-Fragen dort `CLAUDE.md` im Backend-Repo lesen
- **Frontend (dieses Repo):** `accounting-3blocks-net`

Frontend und Backend werden parallel als getrennte Repositories gepflegt und getrennt deployt. Lokale absolute Pfade gehören nicht in Code oder Dokumentation; falls beide Repos lokal nebeneinander liegen, genügt eine relative Orientierung über die Repo-Namen.

Schema-Änderungen am Backend (Prisma, DTOs, Controller-Returns) **müssen** aktuell in `src/types/index.ts` und `src/lib/api.ts` gespiegelt werden. Zielbild: Types/API-Client aus der vorhandenen Backend-Swagger/OpenAPI-Spezifikation generieren; siehe `docs/API_GENERATION.md`.

Deployment-Struktur: siehe `docs/DEPLOYMENT.md`.

---

## Tech-Stack

- **Next.js 16.2.4** (App Router, RSC) — ⚠️ siehe Hinweis oben
- **React 19**
- **TypeScript 5** (strict)
- **Tailwind CSS 4** (CSS-First, via `@tailwindcss/postcss`)
- **shadcn/ui** (`style: base-nova`, `baseColor: neutral`, `iconLibrary: lucide`)
- **Base UI** (`@base-ui/react`) — Headless-Primitives, von shadcn-Komponenten verwendet
- **TanStack Query v5** — Server-State, Caching, Mutations
- **Sonner** — Toasts (`richColors`, `top-right`)
- **date-fns** — Datums-Formatting
- **react-day-picker** — Date Picker

Dev-Server: **Port 3001** (`npm run dev`). Backend läuft auf 3000.

---

## Projektstruktur

```
src/
  app/                              App Router
    layout.tsx                      Root-Layout: Providers + Sidebar + <main>
    page.tsx                        / → redirect('/dashboard')
    globals.css                     Tailwind v4 + Theme-Variablen
    dashboard/page.tsx              Übersicht
    transactions/
      page.tsx                      Liste mit Filtern (kind, wallet)
      [txId]/page.tsx               Detail + Edit
    portfolio/page.tsx              Salden zum Stichtag
    spam-tokens/page.tsx            Spam-/Whitelist-Verwaltung

  components/
    Providers.tsx                   QueryClientProvider + Toaster
    layout/Sidebar.tsx              Navigation
    transactions/
      TransactionTable.tsx
      TransactionEditModal.tsx      PATCH-Form für /transactions/:txId
    portfolio/BalanceTable.tsx
    spam-tokens/SpamTokenTable.tsx
    ui/                             shadcn-Komponenten (button, dialog, select, …)

  lib/
    api.ts                          fetch-Wrapper, alle Endpoints typisiert
    queryKeys.ts                    zentrale Query-Key-Factory
    explorer.ts                     Block-Explorer-URL pro Network
    utils.ts                        cn() (clsx + tailwind-merge)

  types/index.ts                    Geteilte Domain-Types (spiegelt Backend)
```

Path-Alias: `@/*` → `src/*`. shadcn-Aliase: `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`.

---

## Datenfluss

```
React-Komponente
  → useQuery(queryKeys.X) / useMutation
    → lib/api.ts (request<T>)
      → fetch(`${NEXT_PUBLIC_API_BASE_URL}${path}`)
        → NestJS Backend
```

- **Read:** `useQuery` mit Keys aus `lib/queryKeys.ts`. Kein direktes `fetch` in Komponenten.
- **Write:** `useMutation` + `queryClient.invalidateQueries({ queryKey: queryKeys.X })` + Toast (`sonner`).
- **Errors:** `request<T>` wirft `Error` mit `${status} ${text}` — Komponenten zeigen via `<Alert variant="destructive">` oder `toast.error(...)`.
- **Defaults:** `staleTime: 30s`, `retry: 1` (siehe `Providers.tsx`).

---

## Domain-Types (`src/types/index.ts`)

Müssen mit Backend (`prisma/schema.prisma` + Controller-Returns) konsistent bleiben:

- `Transaction` — `txId`, `date`, `kind`, `network`, Fee-Felder, `isSpam`, `transfers[]`
- `Transfer` — `asset`, `amount`, `from/to` + `sender/receiver` (lesbare Namen), `direction`, Preis-/Wertfelder, `isSpam`
- `TransactionKind` — `'PAYMENT_IN' | 'PAYMENT_OUT' | 'INTERNAL' | 'SWAP'`
- `TransactionUpdateBody` — alle Felder optional (PATCH)
- `Paginated<T>` — `{ data, total, page, pageSize, totalPages }` (alle Listen-Endpoints)
- `TransactionStats` — `{ total, byKind: Record<TransactionKind, number> }`
- `TransactionListParams` / `TransactionStatsParams` — typed Filter-Inputs für Listen / Stats
- `SpamToken` / `SpamStatus` — `'SPAM' | 'WHITELISTED'`
- `PortfolioBalances` — `Record<wallet, Record<asset, { balance, tokenAddress }>>`

**Geld-/Mengenwerte sind Strings** (Backend liefert sie so, um Präzision zu wahren). Nur fürs Display in Numbers konvertieren, nie in Berechnungen ohne `BigNumber`/Decimal.

---

## API-Schicht (`src/lib/api.ts`)

Aktueller Endpoint-Mapping:

| Frontend-Funktion                       | HTTP   | Backend-Pfad                              |
| --------------------------------------- | ------ | ----------------------------------------- |
| `getTransactions(params?)`              | GET    | `/transactions?…` (paginiert)             |
| `getTransactionStats(params?)`          | GET    | `/transactions/stats?…`                   |
| `getTransactionWallets()`               | GET    | `/transactions/wallets`                   |
| `getTransaction(txId)`                  | GET    | `/transactions/:txId`                     |
| `updateTransaction(txId, body)`         | PATCH  | `/transactions/:txId`                     |
| `getPortfolioBalances(date, exclSpam?)` | GET    | `/portfolio/balances?date=…&excludeSpam=` |
| `getSpamTokens(status?)`                | GET    | `/spam-tokens[?status=…]`                 |
| `whitelistToken(id, note?)`             | PATCH  | `/spam-tokens/:id/whitelist`              |
| `remarkAsSpam(id)`                      | PATCH  | `/spam-tokens/:id/spam`                   |
| `triggerSync()`                         | POST   | `/sync/trigger`                           |

`getTransactions` liefert `Paginated<Transaction>` (`{ data, total, page, pageSize, totalPages }`). Verfügbare Params (alle optional): `page`, `pageSize` (max 500), `kind`, `network`, `sourceType`, `asset`, `wallet`, `dateFrom`, `dateTo`, `excludeSpam`. Server-side filtering — kein clientseitiges `data.filter(...)` über Listen mehr.

`getTransactionStats` liefert `{ total, byKind: { PAYMENT_IN, PAYMENT_OUT, INTERNAL, SWAP } }` und akzeptiert dieselben Filter (außer `kind` und Pagination). Wird vom Dashboard genutzt; auf der Transaktionen-Liste für die Filter-Counts.

`getTransactionWallets` liefert ein sortiertes `string[]` für das Wallet-Filter-Dropdown.

Neue Endpunkte → **immer** typisiert in `api.ts` ergänzen, nicht inline `fetch`. Param-Konstruktion über das interne `buildQuery()`-Helper, das `undefined`/`null`/`''` automatisch dropt.

---

## Query-Keys (`src/lib/queryKeys.ts`)

Zentrale Factory, **keine** Inline-Strings in Komponenten:

```ts
queryKeys.transactions.all                       // Prefix für invalidateQueries
queryKeys.transactions.list(params)              // paginierte Liste, params = TransactionListParams
queryKeys.transactions.stats(params)             // stats, params = TransactionStatsParams
queryKeys.transactions.wallets                   // /transactions/wallets
queryKeys.transactions.detail(txId)
queryKeys.portfolio.balances(date, excludeSpam)
queryKeys.spamTokens.all
queryKeys.spamTokens.filtered(status)
```

`invalidateQueries({ queryKey: queryKeys.transactions.all })` matcht über Prefix alle `list/stats/wallets/detail` Queries — beim Sync und nach Mutations also nur einen Invalidate-Call setzen.

Bei neuer Resource → hier eintragen, dann verwenden.

---

## Styling-Konventionen

- **Tailwind 4** mit CSS-Variablen-Theme aus `globals.css`. Farben über semantische Tokens (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-primary`).
- `cn(...)` aus `@/lib/utils` für conditional classes.
- shadcn-Komponenten **nicht modden** in `components/ui/`; Wrapper drumherum bauen, falls App-spezifisches Verhalten nötig.
- Sidebar/Branding nutzt **Chillax** (Fontshare) für Wordmark, sonst **Geist Sans/Mono** (`next/font/google`).
- Deutsche UI-Texte (App ist intern, deutschsprachiges Team).

---

## Server vs. Client Components

- **Default = Server Component.** `'use client'` nur wenn nötig (Hooks, Browser-APIs, TanStack Query, Event-Handler).
- Pages mit Daten-Fetch nutzen aktuell **Client + TanStack Query** (siehe `transactions/page.tsx`). Konsistent so lassen, bis Server-Fetch-Refactor entschieden wird.
- `Providers.tsx` ist Client Component und wird im Root-Layout gemountet.

---

## Code-Style / Best Practices

- **Keine `any`** — falls unvermeidbar, kommentieren warum.
- **Keine ungenutzten Imports/Variablen** (ESLint via `eslint-config-next` greift).
- **Keine Inline-Magic-Strings** für Routes/Keys — Konstanten bündeln.
- **Memoization** (`useMemo`) für teure Filter/Aggregationen über Query-Daten (siehe `transactions/page.tsx`).
- **Listen** bekommen stabile `key` (DB-IDs bevorzugt, niemals Index bei filterbaren Listen).
- **Ladezustände** mit `<Skeleton>` aus `@/components/ui/skeleton`, nicht mit Spinnern.
- **Fehler** mit `<Alert variant="destructive">` (statisch) oder `toast.error()` (Mutation-Feedback).
- **Imports sortiert:** externe → `@/types` → `@/lib` → `@/components` → relativ.
- **Komponenten-Dateien:** PascalCase. Ein Default-Export pro Page, sonst Named Exports.
- **Keine direkten DOM-Manipulationen** außerhalb von Effects.

---

## Häufige Aufgaben

**Neuen Endpoint im Frontend anbinden:**
1. Type in `src/types/index.ts` ergänzen (Backend-konform)
2. Funktion in `src/lib/api.ts` typisiert hinzufügen
3. Query-Key in `src/lib/queryKeys.ts` registrieren
4. `useQuery` / `useMutation` in der Page/Komponente verwenden
5. Bei Mutation: `invalidateQueries` für betroffene Keys + Toast

**Neue shadcn-Komponente:**
```bash
npx shadcn@latest add <component>
```
→ landet in `src/components/ui/`. Aliase aus `components.json` werden respektiert.

**Neue Page (App Router):**
```
src/app/<segment>/page.tsx
```
Sidebar (`src/components/layout/Sidebar.tsx`) → `navItems` ergänzen.

**Neue Domain-Komponente:**
`src/components/<domain>/<Name>.tsx` (Domain = `transactions`, `portfolio`, `spam-tokens`, …). Generische UI bleibt in `components/ui/`.

**Block-Explorer für neues Netzwerk:**
`src/lib/explorer.ts` → `EXPLORER_MAP` und `getExplorerName()` ergänzen.

**Tailwind-Theme anpassen:**
`src/app/globals.css` → CSS-Variablen unter `:root` / `.dark`. shadcn-Tokens beibehalten.

**Lokal entwickeln:**
```bash
npm run dev          # http://localhost:3001
```
Erwartet das Backend auf `http://localhost:3000`. Override via `NEXT_PUBLIC_API_BASE_URL` in `.env.local`.

**API-Types aus Swagger generieren:**
```bash
npm run generate:api
```
Default: `http://localhost:3000/swagger-json`. Override via `OPENAPI_URL`.

---

## Environment Variables

```bash
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"   # Backend-URL (default)
```

Nur `NEXT_PUBLIC_*` ist im Browser sichtbar. Keine Secrets — App ist rein clientseitig gegen Backend.

---

## Was es (noch) NICHT gibt

- **Keine Auth** — Tool ist intern, läuft hinter VPN/Internal-Deployment.
- **Keine Tests** im Frontend (Stand jetzt). Backend hat Jest-Setup.
- **Keine Server Actions** — alle Mutationen via TanStack Query gegen REST.
- **Keine i18n-Library** — UI-Texte direkt deutsch im Code.
- **Kein Dark/Light-Toggle** — UI ist dunkel-only (siehe Sidebar-Hardcodes).

Bei Bedarf bewusst entscheiden + hier dokumentieren.
