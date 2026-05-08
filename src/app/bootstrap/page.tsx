'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bootstrapAdmin } from '@/lib/api';

export default function BootstrapPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsPending(true);
    try {
      const user = await bootstrapAdmin({ name, email, password });
      queryClient.setQueryData(['auth', 'me'], user);
      router.replace('/dashboard');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Initialen Admin erstellen</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Nur möglich, solange noch kein Benutzer existiert.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Passwort</Label>
            <Input id="password" type="password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required />
            <p className="text-xs text-muted-foreground">Mindestens 12 Zeichen.</p>
          </div>
        </div>

        <Button type="submit" className="mt-5 w-full" disabled={isPending}>
          {isPending ? 'Erstelle Admin…' : 'Admin erstellen'}
        </Button>
      </form>
    </div>
  );
}
