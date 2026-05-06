'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { getTransactions, triggerSync } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { TransactionKind } from '@/types';

const KINDS: TransactionKind[] = ['PAYMENT_IN', 'PAYMENT_OUT', 'INTERNAL', 'SWAP'];

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.transactions.all,
    queryFn: () => getTransactions(),
  });

  const syncMutation = useMutation({
    mutationFn: triggerSync,
    onSuccess: (result) => {
      toast.success(`${result.synced} Zeilen synchronisiert`);
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const counts = KINDS.reduce(
    (acc, k) => {
      acc[k] = data?.filter((t) => t.kind === k).length ?? 0;
      return acc;
    },
    {} as Record<TransactionKind, number>,
  );

  const recent = data?.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10) ?? [];

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
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {isPending ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Gesamt" value={data?.length ?? 0} />
          {KINDS.map((k) => (
            <StatCard key={k} label={k} value={counts[k]} kind={k} />
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Letzte 10 Transaktionen</h2>
        {isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <TransactionTable transactions={recent} compact />
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
