import type {
  Transaction,
  TransactionKind,
  TransactionUpdateBody,
  PortfolioBalances,
  SpamStatus,
  SpamToken,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export function getTransactions(kind?: TransactionKind): Promise<Transaction[]> {
  const params = kind ? `?kind=${kind}` : '';
  return request<Transaction[]>(`/transactions${params}`);
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

export function triggerSync(): Promise<{ synced: number }> {
  return request<{ synced: number }>('/sync/trigger', { method: 'POST' });
}
