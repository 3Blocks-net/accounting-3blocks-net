export const queryKeys = {
  transactions: {
    all: ['transactions'] as const,
    filtered: (kind?: string) => ['transactions', kind] as const,
    detail: (txId: string) => ['transactions', txId] as const,
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
