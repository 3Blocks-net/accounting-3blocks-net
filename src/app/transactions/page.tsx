'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon, Check, ShieldOff, Wallet, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const KIND_LABELS: Record<TransactionKind, string> = {
  PAYMENT_IN: 'Eingang',
  PAYMENT_OUT: 'Ausgang',
  INTERNAL: 'Intern',
  SWAP: 'Swap',
};

function formatDateParam(date?: Date) {
  return date ? format(date, 'yyyy-MM-dd') : undefined;
}

function getInitialSearchParams() {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

function isTransactionKind(value: string | null): value is TransactionKind {
  return KINDS.includes(value as TransactionKind);
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseDateParam(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return undefined;

  return date;
}

function parseInitialDateRange(): DateRange | undefined {
  const params = getInitialSearchParams();
  const from = parseDateParam(params.get('dateFrom'));
  const to = parseDateParam(params.get('dateTo')) ?? from;
  return from ? { from, to } : undefined;
}

function formatDateRangeLabel(range?: DateRange) {
  if (!range?.from) return 'Zeitraum';
  if (!range.to || format(range.from, 'yyyy-MM-dd') === format(range.to, 'yyyy-MM-dd')) {
    return format(range.from, 'dd.MM.yyyy', { locale: de });
  }
  return `${format(range.from, 'dd.MM.yyyy', { locale: de })} – ${format(range.to, 'dd.MM.yyyy', { locale: de })}`;
}

export default function TransactionsPage() {
  const [kindFilter, setKindFilter] = useState<TransactionKind | 'ALL'>('ALL');
  const [walletFilter, setWalletFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [hideSpam, setHideSpam] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const hasInitializedUrlState = useRef(false);

  const scrollToPageTop = () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'auto' });
    });
  };

  const changeKind = (k: TransactionKind | 'ALL') => {
    setKindFilter(k);
    setPage(1);
  };
  const changeWallet = (w: string) => {
    setWalletFilter(w);
    setPage(1);
  };
  const changeDateRange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  };
  const clearDateRange = () => {
    setDateRange(undefined);
    setPage(1);
  };
  const changeHideSpam = (v: boolean) => {
    setHideSpam(v);
    setPage(1);
  };
  const changePage = (n: number) => {
    setPage(n);
    scrollToPageTop();
  };
  const changePageSize = (n: number) => {
    setPageSize(n);
    setPage(1);
    scrollToPageTop();
  };
  const resetFilters = () => {
    setKindFilter('ALL');
    setWalletFilter('ALL');
    setDateRange(undefined);
    setHideSpam(true);
    setPage(1);
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = getInitialSearchParams();
      const kind = params.get('kind');

      hasInitializedUrlState.current = true;
      setKindFilter(isTransactionKind(kind) ? kind : 'ALL');
      setWalletFilter(params.get('wallet') ?? 'ALL');
      setDateRange(parseInitialDateRange());
      setHideSpam(params.get('spam') !== 'include');
      setPage(parsePositiveInt(params.get('page'), 1));
      setPageSize(parsePositiveInt(params.get('pageSize'), 50));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hasInitializedUrlState.current) return;

    const params = new URLSearchParams();
    if (kindFilter !== 'ALL') params.set('kind', kindFilter);
    if (walletFilter !== 'ALL') params.set('wallet', walletFilter);
    if (dateRange?.from) params.set('dateFrom', formatDateParam(dateRange.from) ?? '');
    if (dateRange?.to ?? dateRange?.from) {
      params.set('dateTo', formatDateParam(dateRange.to ?? dateRange.from) ?? '');
    }
    if (!hideSpam) params.set('spam', 'include');
    if (page > 1) params.set('page', String(page));
    if (pageSize !== 50) params.set('pageSize', String(pageSize));

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) window.history.replaceState(null, '', nextUrl);
  }, [kindFilter, walletFilter, dateRange, hideSpam, page, pageSize]);

  const listParams: TransactionListParams = useMemo(
    () => ({
      page,
      pageSize,
      kind: kindFilter === 'ALL' ? undefined : kindFilter,
      wallet: walletFilter === 'ALL' ? undefined : walletFilter,
      dateFrom: formatDateParam(dateRange?.from),
      dateTo: formatDateParam(dateRange?.to ?? dateRange?.from),
      excludeSpam: hideSpam || undefined,
    }),
    [page, pageSize, kindFilter, walletFilter, dateRange, hideSpam],
  );

  const statsParams = useMemo(
    () => ({
      wallet: walletFilter === 'ALL' ? undefined : walletFilter,
      dateFrom: formatDateParam(dateRange?.from),
      dateTo: formatDateParam(dateRange?.to ?? dateRange?.from),
      excludeSpam: hideSpam || undefined,
    }),
    [walletFilter, dateRange, hideSpam],
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
  const isFiltered = kindFilter !== 'ALL' || walletFilter !== 'ALL' || !!dateRange?.from || !hideSpam;

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

      {/* Type Tabs */}
      <Tabs value={kindFilter} onValueChange={(value) => changeKind(value as TransactionKind | 'ALL')}>
        <TabsList className="bg-card shadow-[0_1px_2px_rgba(20,30,60,0.04)] ring-1 ring-border">
          {(['ALL', ...KINDS] as const).map((kind) => (
            <TabsTrigger key={kind} value={kind} className="gap-2 px-3 text-xs">
              {kind === 'ALL' ? 'Alle' : KIND_LABELS[kind]}
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {stats.data ? kindCount(kind).toLocaleString('de-DE') : '—'}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filter-Toolbar */}
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
        {/* Wallet Filter */}
        <Select
          value={walletFilter}
          onValueChange={(v) => changeWallet(v ?? 'ALL')}
        >
          <SelectTrigger className="h-9 w-full min-w-[190px] bg-card text-xs shadow-[0_1px_2px_rgba(20,30,60,0.04)] sm:w-[220px]">
            <Wallet className="size-3.5 text-muted-foreground" />
            <SelectValue placeholder="Alle Wallets" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              <SelectItem value="ALL">Alle Wallets</SelectItem>
              {(wallets.data ?? []).map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <div className="flex h-8 w-full min-w-[230px] items-center gap-1 rounded-lg border border-input bg-card pl-2.5 pr-1 text-xs shadow-[0_1px_2px_rgba(20,30,60,0.04)] sm:w-[260px]">
          <CalendarIcon className="size-3.5 text-muted-foreground" />
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger
              className={cn(
                'inline-flex min-w-0 flex-1 items-center justify-start text-left transition-colors outline-none',
                dateRange?.from ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <span className="truncate">{formatDateRangeLabel(dateRange)}</span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={changeDateRange}
                numberOfMonths={2}
                locale={de}
                showOutsideDays={false}
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
                  onClick={() => changeDateRange({ from: new Date(), to: new Date() })}
                >
                  Heute
                </Button>
                <div className="flex items-center gap-1">
                  {dateRange?.from && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearDateRange}
                    >
                      Löschen
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDatePickerOpen(false)}
                  >
                    Fertig
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {dateRange?.from && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={clearDateRange}
              aria-label="Zeitraum-Filter entfernen"
              className="text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Spam Toggle */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => changeHideSpam(!hideSpam)}
          aria-pressed={hideSpam}
          className={cn(
            'h-8 gap-2 rounded-lg px-2.5 text-xs shadow-[0_1px_2px_rgba(20,30,60,0.04)]',
            hideSpam
              ? 'border-primary/40 bg-primary/8 text-primary hover:bg-primary/10 hover:text-primary'
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
        </Button>

        {/* Reset */}
        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="ml-auto self-center text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
            Filter zurücksetzen
          </Button>
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
        onPageChange={changePage}
        onPageSizeChange={changePageSize}
      />
    </div>
  );
}
