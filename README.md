# 3blocks Wallet Accounting Frontend

Internes Dashboard für das 3blocks Wallet Accounting. Das Frontend visualisiert Transaktionen, Portfolio-Salden und Spam-/Whitelist-Tokens und spricht ausschließlich mit dem Backend `api-accounting-3blocks-net`.

## Architektur

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, TanStack Query
- **Backend:** separates Repo `api-accounting-3blocks-net`, NestJS + Prisma + PostgreSQL
- **Deployment:** separates Docker Image hinter Traefik, siehe `docs/DEPLOYMENT.md`

Frontend und Backend bleiben getrennte Repositories und getrennt deploybar. API-Verträge werden aktuell noch manuell in `src/types/index.ts` und `src/lib/api.ts` gepflegt; als Zielbild gibt es OpenAPI-Typgenerierung aus der Backend-Swagger, siehe `docs/API_GENERATION.md`.

## Entwicklung

```bash
npm install
npm run dev
```

Frontend läuft lokal auf:

```txt
http://localhost:3001
```

Standardmäßig wird das Backend unter `http://localhost:3000` erwartet.

## Environment

```bash
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
```

Nur `NEXT_PUBLIC_*` Variablen sind für den Browser bestimmt. Keine Secrets im Frontend ablegen.

## Scripts

```bash
npm run dev           # Dev-Server auf Port 3001
npm run build         # Production Build
npm run start         # Next.js Start
npm run lint          # ESLint
npm run generate:api  # OpenAPI Types aus Backend-Swagger generieren
```

## API-Typgenerierung

```bash
npm run generate:api
```

Default OpenAPI-Quelle:

```txt
http://localhost:3000/swagger-json
```

Alternative Quelle:

```bash
OPENAPI_URL=https://api.accounting.3blocks.net/swagger-json npm run generate:api
```

Production Swagger ist per Traefik Basic Auth geschützt. Für die tägliche Entwicklung ist die lokale Backend-Swagger empfohlen.

## Projektstruktur

```txt
src/
  app/              Next.js App Router
  components/       UI- und Domain-Komponenten
  lib/              API Wrapper, Query Keys, Utils
  types/            manuell gepflegte Domain Types
  generated/        generierte OpenAPI Types
```

Weitere Agent-/Projektregeln stehen in `AGENTS.md`.
