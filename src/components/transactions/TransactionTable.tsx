'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Pencil,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TransactionEditModal } from './TransactionEditModal';
import type { Transaction, TransactionKind, Transfer } from '@/types';

interface Props {
  transactions: Transaction[];
  compact?: boolean;
}

const kindLabels: Record<TransactionKind, string> = {
  PAYMENT_IN: 'Eingang',
  PAYMENT_OUT: 'Ausgang',
  INTERNAL: 'Intern',
  SWAP: 'Swap',
};

const kindStyles: Record<TransactionKind, string> = {
  PAYMENT_IN: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PAYMENT_OUT: 'border-red-200 bg-red-50 text-red-700',
  INTERNAL: 'border-slate-200 bg-slate-50 text-slate-600',
  SWAP: 'border-blue-200 bg-blue-50 text-blue-700',
};

function KindBadge({ kind }: { kind: TransactionKind }) {
  return (
    <Badge variant="outline" className={cn('h-5 rounded-md px-1.5 text-[10px]', kindStyles[kind])}>
      {kindLabels[kind]}
    </Badge>
  );
}

function KindIcon({ kind }: { kind: TransactionKind }) {
  const className = 'size-3.5';
  if (kind === 'PAYMENT_IN') return <ArrowDownLeft className={cn(className, 'text-emerald-600')} />;
  if (kind === 'PAYMENT_OUT') return <ArrowUpRight className={cn(className, 'text-red-600')} />;
  return <ArrowLeftRight className={cn(className, 'text-blue-600')} />;
}

function formatAmount(amount: string, asset: string) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return `${amount} ${asset}`;
  return `${num.toLocaleString('de-DE', { maximumFractionDigits: 8 })} ${asset}`;
}

function formatMoney(value?: string | null) {
  if (!value) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return null;
  return num.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  });
}

function shorten(value: string, start = 8, end = 6) {
  if (value.length <= start + end + 1) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

function transferLabel(t: Transfer) {
  if (t.direction === 'IN') return t.sender ?? t.from;
  return t.receiver ?? t.to;
}

function summarizeCounterparties(transfers: Transfer[]) {
  const names = transfers
    .map(transferLabel)
    .filter(Boolean)
    .map((name) => (name.length > 34 ? shorten(name, 16, 10) : name));

  return Array.from(new Set(names)).slice(0, 2);
}

function TransferLine({ transfer }: { transfer: Transfer }) {
  const incoming = transfer.direction === 'IN';
  const value = formatMoney(transfer.valueEur);

  return (
    <div
      className={cn(
        'flex min-w-0 items-center justify-between gap-2 rounded-md border border-transparent px-1.5 py-1',
        incoming ? 'bg-emerald-50/60' : 'bg-red-50/50',
        transfer.isSpam && 'bg-muted/50 opacity-60 line-through',
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
            incoming ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
          )}
          aria-label={incoming ? 'Eingang' : 'Ausgang'}
        >
          {incoming ? '+' : '−'}
        </span>
        <span className="min-w-0 truncate font-mono text-xs tabular-nums text-foreground">
          {formatAmount(transfer.amount, transfer.asset)}
        </span>
        {transfer.isSpam && (
          <span
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive no-underline"
            title="Spam-Token"
            aria-label="Spam-Token"
          >
            <ShieldAlert className="size-3" />
          </span>
        )}
      </div>
      {value && (
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
          {value}
        </span>
      )}
    </div>
  );
}

function TransactionRow({ tx, compact, onEdit }: { tx: Transaction; compact: boolean; onEdit: (tx: Transaction) => void }) {
  const router = useRouter();
  const detailHref = `/transactions/${encodeURIComponent(tx.txId)}`;
  const counterparties = useMemo(() => summarizeCounterparties(tx.transfers), [tx.transfers]);
  const visibleTransfers = compact ? tx.transfers.slice(0, 2) : tx.transfers.slice(0, 3);
  const moreTransfers = tx.transfers.length - visibleTransfers.length;

  const openDetails = () => router.push(detailHref);

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={openDetails}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetails();
        }
      }}
      className={cn(
        'group cursor-pointer border-t border-border/60 transition-colors first:border-t-0 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        tx.isSpam && 'bg-muted/20 opacity-70 hover:opacity-95',
      )}
    >
      <td className="w-[190px] px-3 py-2.5 align-top">
        <div className="flex min-w-0 gap-2.5">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background">
            <KindIcon kind={tx.kind} />
          </div>
          <div className="min-w-0">
            <Link
              href={detailHref}
              onClick={(event) => event.stopPropagation()}
              className="block font-medium text-foreground"
            >
              {format(new Date(tx.date), 'dd.MM.yyyy', { locale: de })}
            </Link>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
              <span>{format(new Date(tx.date), 'HH:mm')}</span>
              <span className="text-muted-foreground/40">·</span>
              <span title={tx.txId}>{shorten(tx.txId)}</span>
            </div>
            {!compact && tx.note && (
              <div className="mt-1 max-w-[150px] truncate text-xs text-muted-foreground" title={tx.note}>
                {tx.note}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="w-[150px] px-2 py-2.5 align-top">
        <div className="flex flex-wrap items-center gap-1.5">
          <KindBadge kind={tx.kind} />
          <Badge variant="secondary" className="h-5 rounded-md px-1.5 font-mono text-[10px] uppercase tracking-wide">
            {tx.network}
          </Badge>
          {tx.isSpam && (
            <Badge variant="destructive" className="h-5 rounded-md text-[10px]">
              <ShieldAlert className="size-3" />
              Spam
            </Badge>
          )}
        </div>
      </td>

      <td className="min-w-[260px] px-2 py-2.5 align-top">
        <div className="flex flex-col gap-1">
          {visibleTransfers.map((transfer) => (
            <TransferLine key={transfer.id} transfer={transfer} />
          ))}
          {moreTransfers > 0 && (
            <Link
              href={detailHref}
              onClick={(event) => event.stopPropagation()}
              className="px-2 pt-0.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              +{moreTransfers} weitere Transfers anzeigen
            </Link>
          )}
        </div>
      </td>

      {!compact && (
        <td className="w-[170px] px-2 py-2.5 align-top">
          {counterparties.length > 0 ? (
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {counterparties.map((name) => (
                <span key={name} className="truncate" title={name}>
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground/40">—</span>
          )}
        </td>
      )}

      <td className="w-[130px] px-2 py-2.5 align-top">
        {tx.feeAmount && tx.feeAsset ? (
          <div className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatAmount(tx.feeAmount, tx.feeAsset)}
          </div>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>

      {!compact && (
        <td className="w-[58px] px-2 py-2.5 align-top">
          <div className="flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(tx);
              }}
              aria-label="Transaktion bearbeiten"
              className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

export function TransactionTable({ transactions, compact = false }: Props) {
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const cols = compact ? 4 : 6;

  return (
    <>
      <div className="w-full overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(20,30,60,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border/70 bg-muted/70 text-[10px] uppercase tracking-[0.08em] text-muted-foreground backdrop-blur">
                <th className="px-3 py-2 text-left font-medium">Transaktion</th>
                <th className="px-2 py-2 text-left font-medium">Typ</th>
                <th className="px-2 py-2 text-left font-medium">Bewegung</th>
                {!compact && <th className="px-2 py-2 text-left font-medium">Gegenpartei</th>}
                <th className="px-2 py-2 text-left font-medium">Fee</th>
                {!compact && <th className="px-2 py-2 text-right font-medium" aria-label="Aktionen" />}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={cols} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Keine Transaktionen
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <TransactionRow key={tx.txId} tx={tx} compact={compact} onEdit={setEditTx} />
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
