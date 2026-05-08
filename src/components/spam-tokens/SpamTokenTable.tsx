'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { whitelistToken, remarkAsSpam } from '@/lib/api';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/queryKeys';
import type { SpamToken } from '@/types';

interface Props {
  tokens: SpamToken[];
}

function shortenAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function StatusBadge({ status }: { status: SpamToken['status'] }) {
  const isSpam = status === 'SPAM';
  const Icon = isSpam ? ShieldAlert : CheckCircle2;

  return (
    <Badge
      variant="outline"
      className={cn(
        'h-5 rounded-md px-1.5 text-[10px]',
        isSpam
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700',
      )}
    >
      <Icon className="size-3" />
      {isSpam ? 'Blocklist' : 'Allowlist'}
    </Badge>
  );
}

function AllowlistAction({ token }: { token: SpamToken }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => whitelistToken(token.id, note || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spamTokens.all });
      toast.success(`${token.symbol ?? token.tokenKey} allowlisted`);
      setOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 text-xs')}>
        Allowlisten
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="flex flex-col gap-2">
          <Label className="text-xs">Notiz (optional)</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="text-xs"
            placeholder="Grund…"
          />
          <Button
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="h-7 text-xs"
          >
            {mutation.isPending ? 'Speichern…' : 'Bestätigen'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BlocklistAction({ token }: { token: SpamToken }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => remarkAsSpam(token.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spamTokens.all });
      toast.success(`${token.symbol ?? token.tokenKey} blocklisted`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 text-xs"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      Blocklisten
    </Button>
  );
}

export function SpamTokenTable({ tokens }: Props) {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(20,30,60,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
          <thead className="bg-muted/70 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Token</th>
              <th className="px-2 py-2 text-left font-medium">Network</th>
              <th className="px-2 py-2 text-left font-medium">Contract</th>
              <th className="px-2 py-2 text-left font-medium">Status</th>
              <th className="px-2 py-2 text-left font-medium">Erstmals gesehen</th>
              <th className="px-2 py-2 text-left font-medium">Notiz</th>
              {canEdit && <th className="px-3 py-2 text-right font-medium" aria-label="Aktionen" />}
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.id} className="border-t border-border/60 transition-colors first:border-t-0 hover:bg-muted/30">
                <td className="px-3 py-2.5 align-top">
                  <div className="font-medium text-foreground">{token.symbol ?? 'Unbekannt'}</div>
                  <div className="mt-0.5 max-w-[220px] truncate font-mono text-[11px] text-muted-foreground" title={token.tokenKey}>
                    {token.tokenKey}
                  </div>
                </td>
                <td className="px-2 py-2.5 align-top">
                  <Badge variant="secondary" className="h-5 rounded-md px-1.5 font-mono text-[10px] uppercase tracking-wide">
                    {token.network ?? '—'}
                  </Badge>
                </td>
                <td className="px-2 py-2.5 align-top font-mono text-xs text-muted-foreground">
                  {token.contractAddress ? shortenAddress(token.contractAddress) : '—'}
                </td>
                <td className="px-2 py-2.5 align-top">
                  <StatusBadge status={token.status} />
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 align-top font-mono text-xs text-muted-foreground">
                  {format(new Date(token.firstSeenAt), 'dd.MM.yyyy')}
                </td>
                <td className="max-w-[220px] truncate px-2 py-2.5 align-top text-xs text-muted-foreground" title={token.note ?? undefined}>
                  {token.note ?? '—'}
                </td>
                {canEdit && (
                  <td className="px-3 py-2.5 align-top">
                    <div className="flex justify-end">
                      {token.status === 'SPAM' ? (
                        <AllowlistAction token={token} />
                      ) : (
                        <BlocklistAction token={token} />
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
