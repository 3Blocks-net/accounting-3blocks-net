import type {
  Paginated,
  PortfolioBalances,
  SpamStatus,
  SpamToken,
  TokenIdentifier,
  Transaction,
  TransactionListParams,
  TransactionStats,
  TransactionStatsParams,
  TransactionUpdateBody,
  User,
  UserRole,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

function buildQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export function getTransactions(
  params: TransactionListParams = {},
): Promise<Paginated<Transaction>> {
  return request<Paginated<Transaction>>(
    `/transactions${buildQuery({ ...params })}`,
  );
}

export function getTransactionStats(
  params: TransactionStatsParams = {},
): Promise<TransactionStats> {
  return request<TransactionStats>(
    `/transactions/stats${buildQuery({ ...params })}`,
  );
}

export function getTransactionWallets(): Promise<string[]> {
  return request<string[]>('/transactions/wallets');
}

export function getTransaction(txId: string): Promise<Transaction> {
  return request<Transaction>(`/transactions/${txId}`);
}

export function updateTransaction(txId: string, body: TransactionUpdateBody): Promise<Transaction> {
  return request<Transaction>(`/transactions/${txId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function getPortfolioBalances(
  date: string,
  excludeSpam?: boolean,
): Promise<PortfolioBalances> {
  const params = new URLSearchParams({ date });
  if (excludeSpam !== undefined) params.set('excludeSpam', String(excludeSpam));
  return request<PortfolioBalances>(`/portfolio/balances?${params}`);
}

export function getSpamTokens(status?: SpamStatus): Promise<SpamToken[]> {
  const params = status ? `?status=${status}` : '';
  return request<SpamToken[]>(`/spam-tokens${params}`);
}

export function whitelistToken(id: string, note?: string): Promise<SpamToken> {
  return request<SpamToken>(`/spam-tokens/${id}/whitelist`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
}

export function remarkAsSpam(id: string): Promise<SpamToken> {
  return request<SpamToken>(`/spam-tokens/${id}/spam`, { method: 'PATCH' });
}

/**
 * Token via Transfer-Identität whitelisten — upsert auf Backend.
 * Funktioniert auch für Tokens, die noch keinen SpamToken-Record haben.
 */
export function whitelistTransferToken(input: TokenIdentifier): Promise<SpamToken> {
  return request<SpamToken>('/spam-tokens/by-token/whitelist', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

/**
 * Token via Transfer-Identität als Spam markieren — upsert auf Backend.
 * Legt einen Record an, falls noch keiner existiert.
 */
export function flagTransferTokenAsSpam(input: TokenIdentifier): Promise<SpamToken> {
  return request<SpamToken>('/spam-tokens/by-token/spam', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function triggerSync(): Promise<{ synced: number }> {
  return request<{ synced: number }>('/sync/trigger', { method: 'POST' });
}

export function login(email: string, password: string): Promise<User> {
  return request<User>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function bootstrapAdmin(input: { email: string; name: string; password: string }): Promise<User> {
  return request<User>('/auth/bootstrap', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function logout(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/auth/logout', { method: 'POST' });
}

export function getMe(): Promise<User> {
  return request<User>('/auth/me');
}

export function getUsers(): Promise<User[]> {
  return request<User[]>('/users');
}

export function createUser(input: { email: string; name: string; password: string; role: UserRole }): Promise<User> {
  return request<User>('/users', { method: 'POST', body: JSON.stringify(input) });
}

export function updateUser(id: string, input: { email?: string; name?: string; role?: UserRole; isActive?: boolean }): Promise<User> {
  return request<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function resetUserPassword(id: string, password: string): Promise<User> {
  return request<User>(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) });
}
