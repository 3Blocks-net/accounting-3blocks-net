'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200],
  className,
}: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-3 text-xs text-muted-foreground ${className ?? ''}`}
    >
      <div className="font-mono tabular-nums">
        {total === 0 ? (
          'Keine Einträge'
        ) : (
          <>
            <span className="text-foreground">{start.toLocaleString('de-DE')}</span>
            <span className="mx-1">–</span>
            <span className="text-foreground">{end.toLocaleString('de-DE')}</span>
            <span className="mx-2 text-muted-foreground/50">/</span>
            <span>{total.toLocaleString('de-DE')}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider">Pro Seite</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-[68px] text-xs font-mono tabular-nums">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs font-mono">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(1)}
            disabled={isFirst}
            aria-label="Erste Seite"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(page - 1)}
            disabled={isFirst}
            aria-label="Vorherige Seite"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <span className="px-2 font-mono tabular-nums text-foreground">
            {totalPages === 0 ? 0 : page}
            <span className="mx-1 text-muted-foreground/50">/</span>
            {totalPages}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(page + 1)}
            disabled={isLast}
            aria-label="Nächste Seite"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(totalPages)}
            disabled={isLast}
            aria-label="Letzte Seite"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
