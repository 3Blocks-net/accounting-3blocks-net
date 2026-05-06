'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { TransactionEditModal } from './TransactionEditModal';
import type { Transaction, TransactionKind } from '@/types';

interface Props {
  transactions: Transaction[];
  compact?: boolean;
}

const kindColors: Record<TransactionKind, string> = {
  PAYMENT_IN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PAYMENT_OUT: 'bg-red-50 text-red-700 border-red-200',
  INTERNAL: 'bg-[#E8ECF6] text-[#63749C] border-[#C8CDE6]',
  SWAP: 'bg-[#EEF1FB] text-[#4568D0] border-[#C4CFE9]',
};

function KindBadge({ kind }: { kind: TransactionKind }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${kindColors[kind]}`}
    >
      {kind}
    </span>
  );
}

function formatAmount(amount: string, asset: string) {
  const num = parseFloat(amount);
  return `${num.toLocaleString('de-DE', { maximumFractionDigits: 8 })} ${asset}`;
}

export function TransactionTable({ transactions, compact = false }: Props) {
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Datum</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Network</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Kind</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Transfers</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Fee</th>
              {!compact && (
                <>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Notiz</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground" />
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.map((tx) => (
              <tr key={tx.txId} className="hover:bg-muted/30 transition-colors group">
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground text-xs">
                  {compact ? (
                    <Link
                      href={`/transactions/${encodeURIComponent(tx.txId)}`}
                      className="hover:text-foreground transition-colors"
                    >
                      {format(new Date(tx.date), 'dd.MM.yy')}
                    </Link>
                  ) : (
                    <>
                      {format(new Date(tx.date), 'dd.MM.yyyy')}
                      <span className="block text-[11px]">{format(new Date(tx.date), 'HH:mm')}</span>
                    </>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">{tx.network}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <KindBadge kind={tx.kind} />
                </td>
                <td className="px-3 py-2 max-w-xs">
                  {tx.transfers.slice(0, compact ? 2 : undefined).map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center gap-1 text-xs ${t.isSpam ? 'line-through text-muted-foreground' : ''}`}
                    >
                      <span
                        className={`text-[10px] font-bold ${t.direction === 'IN' ? 'text-emerald-600' : 'text-red-500'}`}
                      >
                        {t.direction === 'IN' ? '↓' : '↑'}
                      </span>
                      {formatAmount(t.amount, t.asset)}
                    </div>
                  ))}
                  {compact && tx.transfers.length > 2 && (
                    <span className="text-[11px] text-muted-foreground">
                      +{tx.transfers.length - 2} mehr
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                  {tx.feeAmount && tx.feeAsset
                    ? `${parseFloat(tx.feeAmount).toLocaleString('de-DE', { maximumFractionDigits: 8 })} ${tx.feeAsset}`
                    : '—'}
                </td>
                {!compact && (
                  <>
                    <td className="px-3 py-2 text-xs text-muted-foreground max-w-[160px] truncate">
                      {tx.note ? (tx.note.length > 40 ? tx.note.slice(0, 40) + '…' : tx.note) : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/transactions/${encodeURIComponent(tx.txId)}`}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                        >
                          Detail
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setEditTx(tx)}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editTx && (
        <TransactionEditModal
          transaction={editTx}
          open={!!editTx}
          onOpenChange={(open) => !open && setEditTx(null)}
        />
      )}
    </>
  );
}
