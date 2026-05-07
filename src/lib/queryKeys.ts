import type {
  TransactionListParams,
  TransactionStatsParams,
} from '@/types';

export const queryKeys = {
  transactions: {
    all: ['transactions'] as const,
    list: (params: TransactionListParams) =>
      ['transactions', 'list', params] as const,
    stats: (params: TransactionStatsParams = {}) =>
      ['transactions', 'stats', params] as const,
    wallets: ['transactions', 'wallets'] as const,
    detail: (txId: string) => ['transactions', 'detail', txId] as const,
  },
  portfolio: {
    balances: (date: string, excludeSpam: boolean) =>
      ['portfolio', 'balances', date, excludeSpam] as const,
  },
  spamTokens: {
    all: ['spam-tokens'] as const,
    filtered: (status?: string) => ['spam-tokens', status] as const,
  },
};
