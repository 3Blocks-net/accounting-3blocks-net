'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ArrowUpRight, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransactionEditModal } from './TransactionEditModal';
import type { Transaction, TransactionKind } from '@/types';

interface Props {
  transactions: Transaction[];
  compact?: boolean;
}

const kindStyles: Record<TransactionKind, string> = {
  PAYMENT_IN: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  PAYMENT_OUT: 'bg-red-50 text-red-700 ring-red-600/15',
  INTERNAL: 'bg-[#E8ECF6] text-[#63749C] ring-[#63749C]/15',
  SWAP: 'bg-[#EEF1FB] text-[#4568D0] ring-[#4568D0]/20',
};

const kindLabels: Record<TransactionKind, string> = {
  PAYMENT_IN: 'PAYMENT_IN',
  PAYMENT_OUT: 'PAYMENT_OUT',
  INTERNAL: 'INTERNAL',
  SWAP: 'SWAP',
};

function KindBadge({ kind }: { kind: TransactionKind }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ring-1 ring-inset',
        kindStyles[kind],
      )}
    >
      {kindLabels[kind]}
    </span>
  );
}

function formatAmount(amount: string, asset: string) {
  const num = parseFloat(amount);
  return `${num.toLocaleString('de-DE', { maximumFractionDigits: 8 })} ${asset}`;
}

function shortenTxId(txId: string) {
  if (txId.length <= 18) return txId;
  return `${txId.slice(0, 8)}…${txId.slice(-6)}`;
}

export function TransactionTable({ transactions, compact = false }: Props) {
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const cols = compact ? 5 : 7;

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(20,30,60,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Datum</th>
                <th className="px-3 py-2.5 text-left font-medium">Network</th>
                <th className="px-3 py-2.5 text-left font-medium">Kind</th>
                <th className="px-3 py-2.5 text-left font-medium">Transfers</th>
                <th className="px-3 py-2.5 text-left font-medium">Fee</th>
                {!compact && (
                  <>
                    <th className="px-3 py-2.5 text-left font-medium">Notiz</th>
                    <th
                      className="px-3 py-2.5 text-right font-medium"
                      aria-label="Aktionen"
                    />
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={cols}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    Keine Transaktionen
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.txId}
                    className={cn(
                      'group border-t border-border/50 transition-colors first:border-t-0',
                      tx.isSpam
                        ? 'opacity-55 hover:bg-muted/40 hover:opacity-90'
                        : 'hover:bg-muted/40',
                    )}
                  >
                    {/* Datum */}
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <Link
                        href={`/transactions/${encodeURIComponent(tx.txId)}`}
                        className="block text-foreground/90 hover:text-primary transition-colors"
                      >
                        <span className="block font-mono text-xs tabular-nums">
                          {format(new Date(tx.date), compact ? 'dd.MM.yy' : 'dd.MM.yyyy', { locale: de })}
                        </span>
                        {!compact && (
                          <>
                            <span className="block font-mono text-[10px] tabular-nums text-muted-foreground">
                              {format(new Date(tx.date), 'HH:mm:ss')}
                            </span>
                            <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground/60 group-hover:text-muted-foreground">
                              {shortenTxId(tx.txId)}
                            </span>
                          </>
                        )}
                      </Link>
                    </td>

                    {/* Network */}
                    <td className="px-3 py-3 align-top whitespace-nowrap">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {tx.network}
                      </span>
                    </td>

                    {/* Kind */}
                    <td className="px-3 py-3 align-top whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <KindBadge kind={tx.kind} />
                        {tx.isSpam && (
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-red-700 ring-1 ring-inset ring-red-600/30">
                            Spam
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Transfers */}
                    <td className="px-3 py-3 align-top">
                      <div className="space-y-0.5">
                        {tx.transfers
                          .slice(0, compact ? 2 : undefined)
                          .map((t) => (
                            <div
                              key={t.id}
                              className={cn(
                                'flex items-baseline gap-2 font-mono text-xs leading-tight tabular-nums',
                                t.isSpam && 'line-through text-muted-foreground/60',
                              )}
                            >
                              <span
                                className={cn(
                                  'inline-block w-3 shrink-0 text-center font-bold',
                                  t.direction === 'IN'
                                    ? 'text-emerald-600'
                                    : 'text-red-500',
                                )}
                                aria-label={t.direction === 'IN' ? 'Eingang' : 'Ausgang'}
                              >
                                {t.direction === 'IN' ? '+' : '−'}
                              </span>
                              <span className="truncate">
                                {formatAmount(t.amount, t.asset)}
                              </span>
                            </div>
                          ))}
                        {compact && tx.transfers.length > 2 && (
                          <span className="text-[11px] text-muted-foreground">
                            +{tx.transfers.length - 2} weitere
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Fee */}
                    <td className="px-3 py-3 align-top whitespace-nowrap">
                      {tx.feeAmount && tx.feeAsset ? (
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          {parseFloat(tx.feeAmount).toLocaleString('de-DE', {
                            maximumFractionDigits: 8,
                          })}{' '}
                          {tx.feeAsset}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {!compact && (
                      <>
                        {/* Notiz */}
                        <td className="px-3 py-3 align-top">
                          {tx.note ? (
                            <span
                              className="block max-w-[180px] truncate text-xs text-foreground/80"
                              title={tx.note}
                            >
                              {tx.note}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Aktionen */}
                        <td className="px-3 py-3 align-top">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            <Link
                              href={`/transactions/${encodeURIComponent(tx.txId)}`}
                              aria-label="Details öffnen"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              <ArrowUpRight className="size-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setEditTx(tx)}
                              aria-label="Transaktion bearbeiten"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
