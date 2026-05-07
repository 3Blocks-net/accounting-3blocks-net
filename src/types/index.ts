export type TransactionKind = 'PAYMENT_IN' | 'PAYMENT_OUT' | 'INTERNAL' | 'SWAP';

export interface Transfer {
  id: string;
  asset: string;
  amount: string;
  from: string;
  sender: string | null;
  to: string;
  receiver: string | null;
  direction: 'IN' | 'OUT';
  tokenAddress: string | null;
  operation: string | null;
  note: string | null;
  priceUsd: string;
  valueUsd: string;
  priceEur: string;
  valueEur: string;
  transactionId: string;
  isSpam: boolean;
}

export interface TokenIdentifier {
  network: string;
  asset: string;
  tokenAddress?: string | null;
  note?: string;
}

export interface Transaction {
  txId: string;
  date: string;
  sourceType: string;
  kind: TransactionKind;
  network: string;
  feeAsset: string | null;
  feeAmount: string | null;
  priceUsd: string | null;
  valueUsd: string | null;
  priceEur: string | null;
  valueEur: string | null;
  feePayerAddress: string | null;
  feePayer: string | null;
  note: string | null;
  isSpam: boolean;
  transfers: Transfer[];
}

export interface TransactionUpdateBody {
  kind?: TransactionKind;
  note?: string;
  isSpam?: boolean;
  feeAsset?: string;
  feeAmount?: string;
  feePayerAddress?: string;
  feePayer?: string;
  priceUsd?: string;
  valueUsd?: string;
  priceEur?: string;
  valueEur?: string;
}

export type SpamStatus = 'SPAM' | 'WHITELISTED';

export interface SpamToken {
  id: string;
  tokenKey: string;
  status: SpamStatus;
  symbol: string | null;
  network: string | null;
  contractAddress: string | null;
  note: string | null;
  firstSeenAt: string;
  updatedAt: string;
}

export type AssetEntry = { balance: number; tokenAddress: string | null };
export type PortfolioBalances = Record<string, Record<string, AssetEntry>>;

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TransactionStats {
  total: number;
  byKind: Record<TransactionKind, number>;
}

export interface TransactionListParams {
  page?: number;
  pageSize?: number;
  kind?: TransactionKind;
  network?: string;
  sourceType?: string;
  asset?: string;
  dateFrom?: string;
  dateTo?: string;
  wallet?: string;
  excludeSpam?: boolean;
}

export type TransactionStatsParams = Omit<
  TransactionListParams,
  'page' | 'pageSize' | 'kind'
>;
