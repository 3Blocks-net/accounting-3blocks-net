'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SpamTokenTable } from '@/components/spam-tokens/SpamTokenTable';
import { getSpamTokens } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { SpamStatus } from '@/types';

type Filter = SpamStatus | 'ALL';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Alle' },
  { value: 'SPAM', label: 'Blocklist' },
  { value: 'WHITELISTED', label: 'Allowlist' },
];

export default function SpamTokensPage() {
  const [statusFilter, setStatusFilter] = useState<Filter>('ALL');

  const allTokens = useQuery({
    queryKey: queryKeys.spamTokens.filtered(undefined),
    queryFn: () => getSpamTokens(undefined),
  });

  const filteredTokens = statusFilter === 'ALL'
    ? allTokens.data
    : allTokens.data?.filter((token) => token.status === statusFilter);

  const counts: Record<Filter, number> = {
    ALL: allTokens.data?.length ?? 0,
    SPAM: allTokens.data?.filter((token) => token.status === 'SPAM').length ?? 0,
    WHITELISTED: allTokens.data?.filter((token) => token.status === 'WHITELISTED').length ?? 0,
  };

  const isPending = allTokens.isPending;
  const isError = allTokens.isError;
  const error = allTokens.error;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border/70 pb-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Token Review
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Lege fest, welche Tokens in Auswertungen berücksichtigt oder als unerwünscht ausgeblendet werden.
          </p>
        </div>
        <div className="font-mono text-xs tabular-nums text-muted-foreground">
          <span className="text-foreground">{(filteredTokens?.length ?? 0).toLocaleString('de-DE')}</span>
          <span className="ml-1.5">Tokens</span>
        </div>
      </header>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as Filter)}>
        <TabsList className="bg-card shadow-[0_1px_2px_rgba(20,30,60,0.04)] ring-1 ring-border">
          {FILTERS.map((filter) => (
            <TabsTrigger key={filter.value} value={filter.value} className="gap-2 px-3 text-xs">
              {filter.label}
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {counts[filter.value].toLocaleString('de-DE')}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isPending ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ) : filteredTokens && filteredTokens.length > 0 ? (
        <SpamTokenTable tokens={filteredTokens} />
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full border border-border bg-card">
            <ShieldAlert className="size-4 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Keine Tokens gefunden</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Für den aktuellen Statusfilter gibt es keine Einträge.
          </p>
        </div>
      )}
    </div>
  );
}
