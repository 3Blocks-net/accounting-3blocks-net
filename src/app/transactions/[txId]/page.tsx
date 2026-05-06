'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TransactionEditModal } from '@/components/transactions/TransactionEditModal';
import { getTransaction } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { getExplorerUrl, getExplorerName } from '@/lib/explorer';
import type { Transaction, TransactionKind, Transfer } from '@/types';

const kindColors: Record<TransactionKind, string> = {
  PAYMENT_IN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PAYMENT_OUT: 'bg-red-50 text-red-700 border-red-200',
  INTERNAL: 'bg-[#E8ECF6] text-[#63749C] border-[#C8CDE6]',
  SWAP: 'bg-[#EEF1FB] text-[#4568D0] border-[#C4CFE9]',
};

function fmt(val: string | null | undefined, decimals = 8) {
  if (!val) return '—';
  const n = parseFloat(val);
  return n.toLocaleString('de-DE', { maximumFractionDigits: decimals });
}

function fmtUsd(val: string | null | undefined) {
  if (!val) return '—';
  return `$${parseFloat(val).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtEur(val: string | null | undefined) {
  if (!val) return '—';
  return `€${parseFloat(val).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function shortenHash(hash: string, start = 8, end = 6) {
  if (hash.length <= start + end + 3) return hash;
  return `${hash.slice(0, start)}…${hash.slice(-end)}`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded border border-border hover:bg-muted"
    >
      {copied ? '✓' : 'copy'}
    </button>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm text-foreground">{children}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  );
}

function TransferRow({ t }: { t: Transfer }) {
  const isIn = t.direction === 'IN';
  return (
    <tr className={`border-b last:border-0 ${t.isSpam ? 'opacity-50' : ''}`}>
      <td className="px-3 py-3 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold border ${
            isIn
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {isIn ? '↓ IN' : '↑ OUT'}
        </span>
        {t.isSpam && (
          <span className="ml-1.5 text-[10px] bg-red-50 text-red-500 border border-red-200 rounded px-1">
            spam
          </span>
        )}
      </td>
      <td className="px-3 py-3">
        <span className="font-medium text-sm">{t.asset}</span>
        <span className="block font-mono text-xs text-muted-foreground">
          {fmt(t.amount)}
        </span>
      </td>
      <td className="px-3 py-3">
        {t.sender && (
          <span className="block text-sm font-medium">{t.sender}</span>
        )}
        <span className="block font-mono text-[11px] text-muted-foreground">
          {shortenHash(t.from)}
          <CopyButton value={t.from} />
        </span>
      </td>
      <td className="px-3 py-3">
        {t.receiver && (
          <span className="block text-sm font-medium">{t.receiver}</span>
        )}
        <span className="block font-mono text-[11px] text-muted-foreground">
          {shortenHash(t.to)}
          <CopyButton value={t.to} />
        </span>
      </td>
      <td className="px-3 py-3 text-right">
        <span className="block text-sm">{fmtUsd(t.valueUsd)}</span>
        <span className="block text-xs text-muted-foreground">@ {fmtUsd(t.priceUsd)}</span>
      </td>
      <td className="px-3 py-3 text-right">
        <span className="block text-sm">{fmtEur(t.valueEur)}</span>
        <span className="block text-xs text-muted-foreground">@ {fmtEur(t.priceEur)}</span>
      </td>
      <td className="px-3 py-3 text-xs text-muted-foreground">
        {t.operation ?? '—'}
        {t.note && <span className="block text-[11px] italic">{t.note}</span>}
      </td>
    </tr>
  );
}

function TransactionDetail({ tx }: { tx: Transaction }) {
  const [editOpen, setEditOpen] = useState(false);
  const explorerUrl = getExplorerUrl(tx.network, tx.txId);
  const explorerName = getExplorerName(tx.network);
  const router = useRouter();

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            ← Transaktionen
          </button>
          <h1 className="text-xl font-bold text-foreground leading-none">Transaction Detail</h1>
          <div className="flex items-center mt-1.5">
            <span className="font-mono text-xs text-muted-foreground">{shortenHash(tx.txId, 12, 8)}</span>
            <CopyButton value={tx.txId} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              {explorerName}
              <span className="text-muted-foreground">↗</span>
            </a>
          )}
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            Bearbeiten
          </Button>
        </div>
      </div>

      {/* Meta bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${kindColors[tx.kind]}`}>
          {tx.kind}
        </span>
        <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground">
          {tx.network}
        </span>
        <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {format(new Date(tx.date), 'dd.MM.yyyy HH:mm:ss')}
        </span>
        <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {tx.sourceType}
        </span>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Fee &amp; Ausführer">
          <DetailRow label="Fee Betrag">
            {tx.feeAmount && tx.feeAsset
              ? <>{fmt(tx.feeAmount)} <span className="font-medium">{tx.feeAsset}</span></>
              : '—'}
          </DetailRow>
          <DetailRow label="Fee Asset">
            {tx.feeAsset ?? '—'}
          </DetailRow>
          <DetailRow label="Ausgeführt von">
            {tx.feePayer
              ? <span className="font-medium">{tx.feePayer}</span>
              : '—'}
          </DetailRow>
          <DetailRow label="Payer Adresse">
            {tx.feePayerAddress ? (
              <span className="font-mono text-xs">
                {shortenHash(tx.feePayerAddress, 10, 6)}
                <CopyButton value={tx.feePayerAddress} />
              </span>
            ) : '—'}
          </DetailRow>
        </Card>

        <Card title="Transaktionswert">
          <DetailRow label="Preis (USD)">
            {fmtUsd(tx.priceUsd)}
          </DetailRow>
          <DetailRow label="Wert (USD)">
            <span className="font-semibold">{fmtUsd(tx.valueUsd)}</span>
          </DetailRow>
          <DetailRow label="Preis (EUR)">
            {fmtEur(tx.priceEur)}
          </DetailRow>
          <DetailRow label="Wert (EUR)">
            <span className="font-semibold">{fmtEur(tx.valueEur)}</span>
          </DetailRow>
        </Card>
      </div>

      {/* Note */}
      {tx.note && (
        <div className="rounded-lg border bg-card px-4 py-3">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">Notiz</span>
          <p className="text-sm text-foreground">{tx.note}</p>
        </div>
      )}

      {/* Transfers */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">
          Transfers <span className="text-muted-foreground font-normal">({tx.transfers.length})</span>
        </h2>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Dir</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Asset / Betrag</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Von</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide">An</th>
                <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wide">USD</th>
                <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wide">EUR</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Operation</th>
              </tr>
            </thead>
            <tbody>
              {tx.transfers.map((t) => (
                <TransferRow key={t.id} t={t} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionEditModal
        transaction={tx}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}

export default function TransactionDetailPage() {
  const { txId } = useParams<{ txId: string }>();

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.transactions.detail(txId),
    queryFn: () => getTransaction(txId),
  });

  if (isError) {
    return (
      <Alert variant="destructive" className="max-w-xl">
        <AlertDescription>{(error as Error).message}</AlertDescription>
      </Alert>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-4 max-w-6xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return <TransactionDetail tx={data} />;
}
