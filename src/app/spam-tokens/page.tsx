'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { SpamTokenTable } from '@/components/spam-tokens/SpamTokenTable';
import { getSpamTokens } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { SpamStatus } from '@/types';

type Filter = SpamStatus | 'ALL';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Alle' },
  { value: 'SPAM', label: 'Nur SPAM' },
  { value: 'WHITELISTED', label: 'Nur WHITELISTED' },
];

export default function SpamTokensPage() {
  const [statusFilter, setStatusFilter] = useState<Filter>('ALL');

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.spamTokens.filtered(statusFilter === 'ALL' ? undefined : statusFilter),
    queryFn: () => getSpamTokens(statusFilter === 'ALL' ? undefined : statusFilter),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Spam Tokens</h1>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
              statusFilter === f.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : data ? (
        <>
          <p className="text-xs text-muted-foreground">{data.length} Tokens</p>
          <SpamTokenTable tokens={data} />
        </>
      ) : null}
    </div>
  );
}
