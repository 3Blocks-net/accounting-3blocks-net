'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  RefreshCw,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { getTransactions, getTransactionStats, triggerSync } from '@/lib/api';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/queryKeys';
import type { TransactionKind } from '@/types';

const KINDS: TransactionKind[] = ['PAYMENT_IN', 'PAYMENT_OUT', 'INTERNAL', 'SWAP'];
const RECENT_PARAMS = { page: 1, pageSize: 10, excludeSpam: true } as const;

const KIND_META: Record<
  TransactionKind,
  {
    label: string;
    description: string;
    icon: typeof ArrowDownLeft;
    accent: string;
    iconClassName: string;
  }
> = {
  PAYMENT_IN: {
    label: 'Eingänge',
    description: 'Empfangene Zahlungen',
    icon: ArrowDownLeft,
    accent: 'bg-emerald-500',
    iconClassName: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  PAYMENT_OUT: {
    label: 'Ausgänge',
    description: 'Ausgehende Zahlungen',
    icon: ArrowUpRight,
    accent: 'bg-red-500',
    iconClassName: 'text-red-700 bg-red-50 border-red-200',
  },
  INTERNAL: {
    label: 'Intern',
    description: 'Eigene Umbuchungen',
    icon: WalletCards,
    accent: 'bg-slate-500',
    iconClassName: 'text-slate-700 bg-slate-50 border-slate-200',
  },
  SWAP: {
    label: 'Swaps',
    description: 'Token-Tausche',
    icon: ArrowLeftRight,
    accent: 'bg-blue-500',
    iconClassName: 'text-blue-700 bg-blue-50 border-blue-200',
  },
};

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
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Überblick über Transaktionen, Klassifizierung und die letzten Bewegungen.
          </p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={cn('size-3.5', syncMutation.isPending && 'animate-spin')} />
          {syncMutation.isPending ? 'Synchronisieren…' : 'Sync auslösen'}
        </Button>
      </header>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {stats.isPending ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : stats.data ? (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <TotalStatCard value={stats.data.total} />
          {KINDS.map((kind) => (
            <KindStatCard
              key={kind}
              kind={kind}
              value={stats.data.byKind[kind] ?? 0}
              total={stats.data.total}
            />
          ))}
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Letzte Transaktionen
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Die zehn neuesten Bewegungen ohne Spam-Transaktionen.
            </p>
          </div>
          <Link
            href="/transactions"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
          >
            Alle anzeigen
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {recent.isPending ? (
          <div className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : (recent.data?.data.length ?? 0) > 0 ? (
          <TransactionTable transactions={recent.data?.data ?? []} compact />
        ) : (
          <div className="w-full rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              Noch keine Transaktionen gefunden
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Starte einen Sync, um die ersten Bewegungen zu laden.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function TotalStatCard({ value }: { value: number }) {
  return (
    <Link
      href="/transactions"
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(20,30,60,0.04)] transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Gesamt
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
            {value.toLocaleString('de-DE')}
          </p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-primary">
          <WalletCards className="size-4" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Transaktionen insgesamt</span>
        <span className="inline-flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Anzeigen
          <ArrowRight className="size-3" />
        </span>
      </div>
    </Link>
  );
}

function KindStatCard({
  kind,
  value,
  total,
}: {
  kind: TransactionKind;
  value: number;
  total: number;
}) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <Link
      href={`/transactions?kind=${kind}`}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(20,30,60,0.04)] transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className={cn('absolute inset-x-0 top-0 h-1', meta.accent)} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {meta.label}
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
            {value.toLocaleString('de-DE')}
          </p>
        </div>
        <div className={cn('flex size-9 items-center justify-center rounded-lg border', meta.iconClassName)}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{meta.description}</span>
        <span className="font-mono tabular-nums">{percentage}%</span>
      </div>
      <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        Gefiltert anzeigen
        <ArrowRight className="size-3" />
      </div>
    </Link>
  );
}
