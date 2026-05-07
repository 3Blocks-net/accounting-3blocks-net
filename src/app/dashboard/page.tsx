'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { getTransactions, getTransactionStats, triggerSync } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { TransactionKind } from '@/types';

const KINDS: TransactionKind[] = ['PAYMENT_IN', 'PAYMENT_OUT', 'INTERNAL', 'SWAP'];
const RECENT_PARAMS = { page: 1, pageSize: 10 } as const;

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const stats = useQuery({
    queryKey: queryKeys.transactions.stats(),
    queryFn: () => getTransactionStats(),
  });

  const recent = useQuery({
    queryKey: queryKeys.transactions.list(RECENT_PARAMS),
    queryFn: () => getTransactions(RECENT_PARAMS),
  });

  const syncMutation = useMutation({
    mutationFn: triggerSync,
    onSuccess: (result) => {
      toast.success(`${result.synced} Zeilen synchronisiert`);
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isError = stats.isError || recent.isError;
  const errorMessage =
    (stats.error as Error | undefined)?.message ??
    (recent.error as Error | undefined)?.message;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          size="sm"
        >
          {syncMutation.isPending ? 'Synchronisieren…' : 'Sync auslösen'}
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {stats.isPending ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : stats.data ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Gesamt" value={stats.data.total} />
          {KINDS.map((k) => (
            <StatCard key={k} label={k} value={stats.data.byKind[k] ?? 0} kind={k} />
          ))}
        </div>
      ) : null}

      <div>
        <h2 className="text-lg font-semibold mb-3">Letzte 10 Transaktionen</h2>
        {recent.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <TransactionTable transactions={recent.data?.data ?? []} compact />
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  kind,
}: {
  label: string;
  value: number;
  kind?: TransactionKind;
}) {
  const colorMap: Record<TransactionKind, string> = {
    PAYMENT_IN: 'text-emerald-600',
    PAYMENT_OUT: 'text-red-500',
    INTERNAL: 'text-[#63749C]',
    SWAP: 'text-[#4568D0]',
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-bold ${kind ? colorMap[kind] : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
