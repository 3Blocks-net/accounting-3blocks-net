'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsPending(true);
    try {
      const user = await login(email, password);
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
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Anmelden</h1>
        <p className="mt-1 text-xs text-muted-foreground">3blocks Wallet Accounting</p>

        <div className="mt-5 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Passwort</Label>
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
        </div>

        <Button type="submit" className="mt-5 w-full" disabled={isPending}>
          {isPending ? 'Anmelden…' : 'Anmelden'}
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Noch kein Admin? <Link href="/bootstrap" className="text-primary underline-offset-4 hover:underline">Initialen Admin erstellen</Link>
        </p>
      </form>
    </div>
  );
}
