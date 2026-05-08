'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, RotateCcw } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createUser, getUsers, resetUserPassword, updateUser } from '@/lib/api';
import type { User, UserRole } from '@/types';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'VIEWER', label: 'Viewer' },
];

const ROLE_PERMISSIONS: { role: UserRole; label: string; description: string; permissions: string[] }[] = [
  {
    role: 'ADMIN',
    label: 'Admin',
    description: 'Vollzugriff auf System und Benutzerverwaltung.',
    permissions: [
      'Alle Daten ansehen',
      'Transaktionen bearbeiten',
      'Token Review / Allowlist / Blocklist verwalten',
      'Synchronisation und Price Enrichment auslösen',
      'Benutzer erstellen, Rollen ändern, deaktivieren und Passwörter zurücksetzen',
    ],
  },
  {
    role: 'ACCOUNTANT',
    label: 'Accountant',
    description: 'Fachlicher Bearbeitungszugriff ohne Systemadministration.',
    permissions: [
      'Alle Accounting-Daten ansehen',
      'Transaktionen bearbeiten',
      'Token Review / Allowlist / Blocklist verwalten',
      'Keine Benutzerverwaltung',
      'Keine Synchronisation oder Price Enrichment auslösen',
    ],
  },
  {
    role: 'VIEWER',
    label: 'Viewer',
    description: 'Nur lesender Zugriff, z. B. für externe Prüfer oder Steuerberatung.',
    permissions: [
      'Dashboard, Portfolio, Transaktionen und Token Review ansehen',
      'Transaktionsdetails ansehen',
      'Keine Transaktionen bearbeiten',
      'Keine Token klassifizieren',
      'Keine Benutzerverwaltung oder Systemaktionen',
    ],
  },
];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);

  const users = useQuery({ queryKey: ['users'], queryFn: getUsers });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateUser>[1] }) => updateUser(id, input),
    onSuccess: () => {
      invalidate();
      toast.success('Benutzer aktualisiert');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Benutzer</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Verwalte Zugänge, Rollen und aktive Benutzer für das Accounting-Tool.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" />
          Benutzer erstellen
        </Button>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        {ROLE_PERMISSIONS.map((role) => (
          <article key={role.role} className="rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_rgba(20,30,60,0.04)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{role.label}</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{role.description}</p>
              </div>
              <Badge variant="outline" className="bg-muted/60 text-[10px]">
                {role.role}
              </Badge>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {role.permissions.map((permission) => (
                <li key={permission} className="flex gap-2 leading-5">
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary/70" />
                  <span>{permission}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      {users.isPending ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(20,30,60,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
              <thead className="bg-muted/70 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Benutzer</th>
                  <th className="px-2 py-2 text-left font-medium">Rolle</th>
                  <th className="px-2 py-2 text-left font-medium">Status</th>
                  <th className="px-2 py-2 text-left font-medium">Letzter Login</th>
                  <th className="px-3 py-2 text-right font-medium" />
                </tr>
              </thead>
              <tbody>
                {(users.data ?? []).map((user) => {
                  const isCurrentUser = user.id === currentUser?.id;
                  return (
                  <tr key={user.id} className="border-t border-border/60 transition-colors first:border-t-0 hover:bg-muted/30">
                    <td className="px-3 py-2.5 align-top">
                      <div className="font-medium text-foreground">{user.name}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-2 py-2.5 align-top">
                      <Select
                        value={user.role}
                        onValueChange={(role) => updateMutation.mutate({ id: user.id, input: { role: role as UserRole } })}
                        disabled={isCurrentUser}
                      >
                        <SelectTrigger className="h-8 w-[145px] bg-card text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="start">
                          <SelectGroup>
                            {ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-2.5 align-top">
                      <Badge variant="outline" className={user.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}>
                        {user.isActive ? 'Aktiv' : 'Deaktiviert'}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 align-top font-mono text-xs text-muted-foreground">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('de-DE') : '—'}
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setResetUser(user)}>
                          <RotateCcw className="size-3" />
                          Passwort
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => updateMutation.mutate({ id: user.id, input: { isActive: !user.isActive } })}
                          disabled={isCurrentUser}
                        >
                          {user.isActive ? 'Deaktivieren' : 'Aktivieren'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      {resetUser && <ResetPasswordDialog user={resetUser} onOpenChange={() => setResetUser(null)} />}
    </div>
  );
}

function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('VIEWER');

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Benutzer erstellt');
      onOpenChange(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('VIEWER');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate({ name, email, password, role });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Benutzer erstellen</DialogTitle>
          <DialogDescription>Der Benutzer kann sich anschließend mit dem initialen Passwort anmelden.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="flex flex-col gap-1.5"><Label>E-Mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="flex flex-col gap-1.5"><Label>Passwort</Label><Input type="password" minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <div className="flex flex-col gap-1.5">
            <Label>Rolle</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Speichern…' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onOpenChange }: { user: User; onOpenChange: () => void }) {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const mutation = useMutation({
    mutationFn: () => resetUserPassword(user.id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Passwort zurückgesetzt');
      onOpenChange();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Passwort zurücksetzen</DialogTitle>
          <DialogDescription>Neues Passwort für {user.email} setzen.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Neues Passwort</Label>
            <Input type="password" minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onOpenChange}>Abbrechen</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Speichern…' : 'Zurücksetzen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
