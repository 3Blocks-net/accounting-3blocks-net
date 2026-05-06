'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { whitelistToken, remarkAsSpam } from '@/lib/api';
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
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        status === 'SPAM'
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }`}
    >
      {status}
    </span>
  );
}

function WhitelistAction({ token }: { token: SpamToken }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => whitelistToken(token.id, note || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spamTokens.all });
      toast.success(`${token.symbol ?? token.tokenKey} whitelisted`);
      setOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' h-7 text-xs'}>
        Whitelist
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="grid gap-2">
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

function SpamAction({ token }: { token: SpamToken }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => remarkAsSpam(token.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spamTokens.all });
      toast.success(`${token.symbol ?? token.tokenKey} als Spam markiert`);
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
      Als Spam markieren
    </Button>
  );
}

export function SpamTokenTable({ tokens }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Symbol</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Network</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Contract</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Erstmals gesehen</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Notiz</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {tokens.map((token) => (
            <tr key={token.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-3 py-2 font-medium">{token.symbol ?? '—'}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{token.network ?? '—'}</td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                {token.contractAddress ? shortenAddress(token.contractAddress) : '—'}
              </td>
              <td className="px-3 py-2">
                <StatusBadge status={token.status} />
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(token.firstSeenAt), 'dd.MM.yyyy')}
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground max-w-[160px] truncate">
                {token.note ?? '—'}
              </td>
              <td className="px-3 py-2">
                {token.status === 'SPAM' ? (
                  <WhitelistAction token={token} />
                ) : (
                  <SpamAction token={token} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
