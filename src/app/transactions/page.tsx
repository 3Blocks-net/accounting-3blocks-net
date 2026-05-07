'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ShieldOff, Wallet, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { cn } from '@/lib/utils';
import {
  getTransactions,
  getTransactionStats,
  getTransactionWallets,
} from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { TransactionKind, TransactionListParams } from '@/types';

const KINDS: TransactionKind[] = ['PAYMENT_IN', 'PAYMENT_OUT', 'INTERNAL', 'SWAP'];

const KIND_ACCENT: Record<TransactionKind, string> = {
  PAYMENT_IN: 'data-[active=true]:text-emerald-700',
  PAYMENT_OUT: 'data-[active=true]:text-red-600',
  INTERNAL: 'data-[active=true]:text-[#63749C]',
  SWAP: 'data-[active=true]:text-[#4568D0]',
};

export default function TransactionsPage() {
  const [kindFilter, setKindFilter] = useState<TransactionKind | 'ALL'>('ALL');
  const [walletFilter, setWalletFilter] = useState<string>('ALL');
  const [hideSpam, setHideSpam] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const changeKind = (k: TransactionKind | 'ALL') => {
    setKindFilter(k);
    setPage(1);
  };
  const changeWallet = (w: string) => {
    setWalletFilter(w);
    setPage(1);
  };
  const changeHideSpam = (v: boolean) => {
    setHideSpam(v);
    setPage(1);
  };
  const changePageSize = (n: number) => {
    setPageSize(n);
    setPage(1);
  };
  const resetFilters = () => {
    setKindFilter('ALL');
    setWalletFilter('ALL');
    setHideSpam(true);
    setPage(1);
  };

  const listParams: TransactionListParams = useMemo(
    () => ({
      page,
      pageSize,
      kind: kindFilter === 'ALL' ? undefined : kindFilter,
      wallet: walletFilter === 'ALL' ? undefined : walletFilter,
      excludeSpam: hideSpam || undefined,
    }),
    [page, pageSize, kindFilter, walletFilter, hideSpam],
  );

  const statsParams = useMemo(
    () => ({
      wallet: walletFilter === 'ALL' ? undefined : walletFilter,
      excludeSpam: hideSpam || undefined,
    }),
    [walletFilter, hideSpam],
  );

  const list = useQuery({
    queryKey: queryKeys.transactions.list(listParams),
    queryFn: () => getTransactions(listParams),
    placeholderData: (prev) => prev,
  });

  const stats = useQuery({
    queryKey: queryKeys.transactions.stats(statsParams),
    queryFn: () => getTransactionStats(statsParams),
  });

  const wallets = useQuery({
    queryKey: queryKeys.transactions.wallets,
    queryFn: getTransactionWallets,
  });

  const total = list.data?.total ?? 0;
  const totalPages = list.data?.totalPages ?? 1;
  const transactions = list.data?.data ?? [];
  const isFiltered = kindFilter !== 'ALL' || walletFilter !== 'ALL' || !hideSpam;

  const kindCount = (k: TransactionKind | 'ALL') =>
    k === 'ALL' ? stats.data?.total ?? 0 : stats.data?.byKind[k] ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border/70 pb-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Transaktionen
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            On-Chain-Bewegungen, klassifiziert und korrigierbar.
          </p>
        </div>
        <div className="font-mono text-xs tabular-nums text-muted-foreground">
          <span className="text-foreground">{total.toLocaleString('de-DE')}</span>
          <span className="mx-1.5 text-muted-foreground/50">·</span>
          <span>
            Seite {totalPages === 0 ? 0 : page}
            <span className="mx-1 text-muted-foreground/50">/</span>
            {totalPages}
          </span>
        </div>
      </header>

      {/* Error */}
      {list.isError && (
        <Alert variant="destructive">
          <AlertDescription>{(list.error as Error).message}</AlertDescription>
        </Alert>
      )}

      {/* Filter-Toolbar */}
      <div className="flex flex-wrap items-stretch gap-3">
        {/* Kind segmented control */}
        <div className="inline-flex overflow-hidden rounded-md border border-border bg-card shadow-[0_1px_2px_rgba(20,30,60,0.04)]">
          {(['ALL', ...KINDS] as const).map((k, i) => {
            const active = kindFilter === k;
            const accent = k === 'ALL' ? '' : KIND_ACCENT[k];
            return (
              <button
                key={k}
                type="button"
                data-active={active}
                onClick={() => changeKind(k)}
                className={cn(
                  'group/seg relative flex min-w-[72px] flex-col items-center justify-center gap-0.5 px-3.5 py-2 text-left transition-colors',
                  i > 0 && 'border-l border-border',
                  active
                    ? 'bg-muted/70'
                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                  accent,
                )}
              >
                <span
                  className={cn(
                    'text-[10px] font-semibold uppercase tracking-[0.08em]',
                    active ? 'text-current' : 'text-muted-foreground',
                  )}
                >
                  {k === 'ALL' ? 'Alle' : k}
                </span>
                <span
                  className={cn(
                    'font-mono text-sm tabular-nums leading-none',
                    active ? 'text-current font-semibold' : 'text-foreground/75',
                  )}
                >
                  {stats.data ? kindCount(k).toLocaleString('de-DE') : '—'}
                </span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-current opacity-90"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Wallet Filter */}
        <div className="flex items-center gap-1 rounded-md border border-border bg-card pl-2.5 pr-1 shadow-[0_1px_2px_rgba(20,30,60,0.04)]">
          <Wallet className="size-3.5 text-muted-foreground" />
          <Select
            value={walletFilter}
            onValueChange={(v) => changeWallet(v ?? 'ALL')}
          >
            <SelectTrigger className="h-9 w-[180px] border-0 bg-transparent px-1 text-xs shadow-none focus:ring-0 focus-visible:ring-0">
              <SelectValue placeholder="Alle Wallets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Alle Wallets</SelectItem>
              {(wallets.data ?? []).map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {walletFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => changeWallet('ALL')}
              className="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
              aria-label="Wallet-Filter entfernen"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Spam Toggle */}
        <button
          type="button"
          onClick={() => changeHideSpam(!hideSpam)}
          aria-pressed={hideSpam}
          className={cn(
            'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors shadow-[0_1px_2px_rgba(20,30,60,0.04)]',
            hideSpam
              ? 'border-primary/40 bg-primary/8 text-primary'
              : 'border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground',
          )}
        >
          <span
            className={cn(
              'flex size-3.5 items-center justify-center rounded-sm border transition-colors',
              hideSpam
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card',
            )}
            aria-hidden
          >
            {hideSpam && <Check className="size-2.5" strokeWidth={3} />}
          </span>
          <ShieldOff className="size-3.5" aria-hidden />
          Spam ausblenden
        </button>

        {/* Reset */}
        {isFiltered && (
          <button
            type="button"
            onClick={resetFilters}
            className="ml-auto inline-flex items-center gap-1.5 self-center text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            <X className="size-3" />
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Tabelle / States */}
      {list.isPending ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="space-y-px p-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-sm" />
            ))}
          </div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full border border-border bg-card">
            <ShieldOff className="size-4 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Keine Transaktionen gefunden
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isFiltered
              ? 'Mit den aktuellen Filtern gibt es keine Treffer.'
              : 'Sobald ein Sync läuft, erscheinen hier die Bewegungen.'}
          </p>
          {isFiltered && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      ) : (
        <TransactionTable transactions={transactions} />
      )}

      {/* Pagination — auch bei 0 Treffern rendern, damit pageSize änderbar bleibt */}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={changePageSize}
      />
    </div>
  );
}
