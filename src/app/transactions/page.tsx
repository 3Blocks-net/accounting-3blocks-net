'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { getTransactions } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { TransactionKind } from '@/types';

const KINDS: TransactionKind[] = ['PAYMENT_IN', 'PAYMENT_OUT', 'INTERNAL', 'SWAP'];

export default function TransactionsPage() {
  const [kindFilter, setKindFilter] = useState<TransactionKind | 'ALL'>('ALL');
  const [walletFilter, setWalletFilter] = useState<string>('ALL');

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.transactions.all,
    queryFn: () => getTransactions(),
  });

  const walletNames = useMemo(() => {
    if (!data) return [];
    const names = new Set<string>();
    for (const tx of data) {
      for (const t of tx.transfers) {
        if (t.sender) names.add(t.sender);
        if (t.receiver) names.add(t.receiver);
      }
    }
    return Array.from(names).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data
      .filter((tx) => kindFilter === 'ALL' || tx.kind === kindFilter)
      .filter(
        (tx) =>
          walletFilter === 'ALL' ||
          tx.transfers.some(
            (t) => t.sender === walletFilter || t.receiver === walletFilter,
          ),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data, kindFilter, walletFilter]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Transaktionen</h1>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1">
          {(['ALL', ...KINDS] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                kindFilter === k
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {k === 'ALL' ? 'Alle' : k}
            </button>
          ))}
        </div>

        <Select value={walletFilter} onValueChange={(v) => setWalletFilter(v ?? 'ALL')}>
          <SelectTrigger className="h-8 w-48 text-xs">
            <SelectValue placeholder="Wallet filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alle Wallets</SelectItem>
            {walletNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{filtered.length} Transaktionen</p>
          <TransactionTable transactions={filtered} />
        </>
      )}
    </div>
  );
}
