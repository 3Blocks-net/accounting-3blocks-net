type ExplorerFn = (txId: string) => string;

const EXPLORER_MAP: Record<string, ExplorerFn> = {
  // Ethereum
  ethereum:  (tx) => `https://etherscan.io/tx/${tx}`,
  eth:       (tx) => `https://etherscan.io/tx/${tx}`,
  // Solana
  solana:    (tx) => `https://solscan.io/tx/${tx}`,
  sol:       (tx) => `https://solscan.io/tx/${tx}`,
  // Bitcoin
  bitcoin:   (tx) => `https://mempool.space/tx/${tx}`,
  btc:       (tx) => `https://mempool.space/tx/${tx}`,
  // Polygon
  polygon:   (tx) => `https://polygonscan.com/tx/${tx}`,
  matic:     (tx) => `https://polygonscan.com/tx/${tx}`,
  // Arbitrum
  arbitrum:  (tx) => `https://arbiscan.io/tx/${tx}`,
  arb:       (tx) => `https://arbiscan.io/tx/${tx}`,
  // Optimism
  optimism:  (tx) => `https://optimistic.etherscan.io/tx/${tx}`,
  op:        (tx) => `https://optimistic.etherscan.io/tx/${tx}`,
  // Base
  base:      (tx) => `https://basescan.org/tx/${tx}`,
  // BSC
  bsc:       (tx) => `https://bscscan.com/tx/${tx}`,
  bnb:       (tx) => `https://bscscan.com/tx/${tx}`,
  // Avalanche
  avalanche: (tx) => `https://avascan.info/blockchain/c/tx/${tx}`,
  avax:      (tx) => `https://avascan.info/blockchain/c/tx/${tx}`,
};

export function getExplorerUrl(network: string, txId: string): string | null {
  const fn = EXPLORER_MAP[network.toLowerCase()];
  return fn ? fn(txId) : null;
}

export function getExplorerName(network: string): string {
  const names: Record<string, string> = {
    ethereum: 'Etherscan', eth: 'Etherscan',
    solana: 'Solscan', sol: 'Solscan',
    bitcoin: 'Mempool.space', btc: 'Mempool.space',
    polygon: 'Polygonscan', matic: 'Polygonscan',
    arbitrum: 'Arbiscan', arb: 'Arbiscan',
    optimism: 'OP Etherscan', op: 'OP Etherscan',
    base: 'Basescan',
    bsc: 'BscScan', bnb: 'BscScan',
    avalanche: 'Avascan', avax: 'Avascan',
  };
  return names[network.toLowerCase()] ?? 'Block Explorer';
}
