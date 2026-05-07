# API type generation

The frontend currently still uses hand-written types in `src/types/index.ts` and a hand-written API wrapper in `src/lib/api.ts`.

As a first step, OpenAPI type generation is available:

```bash
npm run generate:api
```

Default source:

```txt
http://localhost:3000/swagger-json
```

Use a different source with:

```bash
OPENAPI_URL=https://api.accounting.3blocks.net/swagger-json npm run generate:api
```

Note: production Swagger is Basic-Auth protected via Traefik. For day-to-day generation, prefer a locally running backend.

Generated output:

```txt
src/generated/api-types.ts
```

Next step after generation is stable: gradually replace manual frontend domain types/API response types with generated `paths`/`components` types.
