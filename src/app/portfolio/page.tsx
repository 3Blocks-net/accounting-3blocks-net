'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { BalanceTable } from '@/components/portfolio/BalanceTable';
import { getPortfolioBalances, getTransactions } from '@/lib/api';
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

  const { data: txData } = useQuery({
    queryKey: queryKeys.transactions.all,
    queryFn: () => getTransactions(),
  });

  const addressNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const tx of txData ?? []) {
      for (const t of tx.transfers) {
        if (t.sender) map.set(t.from, t.sender);
        if (t.receiver) map.set(t.to, t.receiver);
      }
    }
    return map;
  }, [txData]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Portfolio</h1>

      <div className="flex items-center gap-4 flex-wrap">
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' h-8 text-xs w-36'}>
            {format(date, 'dd.MM.yyyy')}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d) {
                  setDate(d);
                  setCalOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2">
          <Checkbox
            id="excludeSpam"
            checked={excludeSpam}
            onCheckedChange={(v) => setExcludeSpam(!!v)}
          />
          <Label htmlFor="excludeSpam" className="text-sm cursor-pointer">
            Spam-Token ausblenden
          </Label>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {isPending ? (
        <div className="space-y-3">
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
