'use client';

import { Badge } from '@/components/ui/badge';
import type { PortfolioBalances } from '@/types';

interface Props {
  balances: PortfolioBalances;
  addressNames?: Map<string, string>;
}

function shortenAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function BalanceTable({ balances, addressNames }: Props) {
  const wallets = Object.entries(balances);

  if (wallets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <p className="text-sm font-medium text-foreground">Keine Daten gefunden</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Für diesen Stichtag liegen keine Salden vor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {wallets.map(([address, assets]) => {
        const nonZero = Object.entries(assets).filter(([, entry]) => entry.balance !== 0);
        if (nonZero.length === 0) return null;

        const name = addressNames?.get(address);

        return (
          <section
            key={address}
            className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(20,30,60,0.04)]"
          >
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 bg-muted/40 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {name ?? 'Unbekannte Wallet'}
                </p>
                <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">
                  {address}
                </p>
              </div>
              <Badge variant="secondary" className="h-5 rounded-md px-1.5 font-mono text-[10px] tabular-nums">
                {nonZero.length} Assets
              </Badge>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-separate border-spacing-0 text-sm">
                <thead className="bg-muted/70 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Asset</th>
                    <th className="px-4 py-2 text-right font-medium">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {nonZero.map(([symbol, entry]) => (
                    <tr key={symbol} className="border-t border-border/60 transition-colors first:border-t-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 align-top">
                        <span className="font-medium text-foreground">{symbol}</span>
                        <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                          {entry.tokenAddress ? shortenAddress(entry.tokenAddress) : 'Nativ'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right align-top font-mono text-xs tabular-nums text-foreground">
                        {entry.balance.toLocaleString('de-DE', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 6,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
