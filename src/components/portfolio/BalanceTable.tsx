'use client';

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
    return <p className="text-muted-foreground text-sm">Keine Daten für diesen Stichtag.</p>;
  }

  return (
    <div className="space-y-6">
      {wallets.map(([address, assets]) => {
        const nonZero = Object.entries(assets).filter(([, entry]) => entry.balance !== 0);
        if (nonZero.length === 0) return null;

        const name = addressNames?.get(address);

        return (
          <div key={address} className="rounded-lg border overflow-hidden">
            {/* Wallet-Header: Name + Adresse immer sichtbar */}
            <div className="bg-muted/50 px-4 py-3 border-b">
              <p className="text-sm font-semibold text-foreground">
                {name ?? 'Unbekannte Wallet'}
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-0.5 break-all">
                {address}
              </p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Asset</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Betrag</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {nonZero.map(([symbol, entry]) => (
                  <tr key={symbol} className="hover:bg-muted/30">
                    <td className="px-4 py-2">
                      <span className="font-medium text-sm">{symbol}</span>
                      <span className="block font-mono text-[11px] text-muted-foreground">
                        {entry.tokenAddress ? shortenAddress(entry.tokenAddress) : 'Nativ'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs">
                      {entry.balance.toLocaleString('de-DE', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 6,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/20">
                  <td className="px-4 py-2 font-bold text-sm">{nonZero.length} Assets</td>
                  <td className="px-4 py-2 text-right text-xs text-muted-foreground font-medium">
                    Gesamt
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      })}
    </div>
  );
}
