'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, Check, ShieldOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { BalanceTable } from '@/components/portfolio/BalanceTable';
import { getPortfolioBalances, getTransactions } from '@/lib/api';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/queryKeys';

export default function PortfolioPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [excludeSpam, setExcludeSpam] = useState(true);

  const dateStr = format(date, 'yyyy-MM-dd');

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.portfolio.balances(dateStr, excludeSpam),
    queryFn: () => getPortfolioBalances(dateStr, excludeSpam),
    enabled: !!dateStr,
  });

  const ADDRESS_MAP_PARAMS = { pageSize: 500 } as const;
  const { data: txData } = useQuery({
    queryKey: queryKeys.transactions.list(ADDRESS_MAP_PARAMS),
    queryFn: () => getTransactions(ADDRESS_MAP_PARAMS),
  });

  const addressNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const tx of txData?.data ?? []) {
      for (const t of tx.transfers) {
        if (t.sender) map.set(t.from, t.sender);
        if (t.receiver) map.set(t.to, t.receiver);
      }
    }
    return map;
  }, [txData]);

  const walletCount = data ? Object.keys(data).length : 0;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border/70 pb-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Portfolio
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Wallet- und Asset-Salden zu einem gewählten Stichtag.
          </p>
        </div>
        <div className="font-mono text-xs tabular-nums text-muted-foreground">
          <span className="text-foreground">{walletCount.toLocaleString('de-DE')}</span>
          <span className="ml-1.5">Wallets</span>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-8 w-full min-w-[170px] items-center gap-1 rounded-lg border border-input bg-card pl-2.5 pr-1 text-xs shadow-[0_1px_2px_rgba(20,30,60,0.04)] sm:w-[180px]">
          <CalendarIcon className="size-3.5 text-muted-foreground" />
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger className="inline-flex min-w-0 flex-1 items-center justify-start text-left text-foreground outline-none">
              <span className="truncate">{format(date, 'dd.MM.yyyy', { locale: de })}</span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (d) {
                    setDate(d);
                    setCalOpen(false);
                  }
                }}
                locale={de}
                disabled={{ after: new Date() }}
                classNames={{
                  day_button:
                    'group-data-[focused=true]/day:border-transparent group-data-[focused=true]/day:ring-0 focus-visible:ring-0',
                }}
              />
              <div className="flex items-center justify-between border-t border-border px-1 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDate(new Date());
                    setCalOpen(false);
                  }}
                >
                  Heute
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCalOpen(false)}
                >
                  Fertig
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => setExcludeSpam(!excludeSpam)}
          aria-pressed={excludeSpam}
          className={cn(
            'h-8 gap-2 rounded-lg px-2.5 text-xs shadow-[0_1px_2px_rgba(20,30,60,0.04)]',
            excludeSpam
              ? 'border-primary/40 bg-primary/8 text-primary hover:bg-primary/10 hover:text-primary'
              : 'border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground',
          )}
        >
          <span
            className={cn(
              'flex size-3.5 items-center justify-center rounded-sm border transition-colors',
              excludeSpam
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card',
            )}
            aria-hidden
          >
            {excludeSpam && <Check className="size-2.5" strokeWidth={3} />}
          </span>
          <ShieldOff className="size-3.5" aria-hidden />
          Spam ausblenden
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : data ? (
        <BalanceTable balances={data} addressNames={addressNames} />
      ) : null}
    </div>
  );
}
