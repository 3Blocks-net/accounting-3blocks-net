'use client';

import { createContext, useContext, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, logout as logoutRequest } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isPending: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const PUBLIC_PATHS = ['/login', '/bootstrap'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path);

  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    retry: false,
    enabled: !isPublicPath,
  });

  useEffect(() => {
    if (!isPublicPath && me.isError) router.replace('/login');
  }, [isPublicPath, me.isError, router]);

  const logout = async () => {
    await logoutRequest().catch(() => undefined);
    queryClient.clear();
    router.replace('/login');
  };

  if (!isPublicPath && me.isPending) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center text-sm text-muted-foreground">
        Lade Sitzung…
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user: me.data ?? null, isPending: me.isPending, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
