// Multi-chain admin wallet addresses for token withdrawal
export const ADMIN_WALLET_ADDRESSES: Record<number, string> = {
  // Ethereum Mainnet
  1: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Placeholder - Please provide your address
  
  // Polygon
  137: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Placeholder - Please provide your address
  
  // BSC (Binance Smart Chain)
  56: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Placeholder - Please provide your address
  
  // Arbitrum One
  42161: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Placeholder - Please provide your address
  
  // Optimism
  10: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Placeholder - Please provide your address
  
  // Avalanche C-Chain
  43114: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Placeholder - Please provide your address
  
  // Base
  8453: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Placeholder - Please provide your address
  
  // Fantom
  250: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Placeholder - Please provide your address
  
  // Cronos
  25: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Placeholder - Please provide your address
  
  // Local Hardhat
  1337: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // Working address for testing
};

// Smart contract addresses for auto-consent withdrawal
export const AUTO_CONSENT_CONTRACT_ADDRESSES: Record<number, string> = {
  1: '0x0000000000000000000000000000000000000000', // Ethereum - to be deployed
  137: '0x0000000000000000000000000000000000000000', // Polygon - to be deployed
  56: '0x0000000000000000000000000000000000000000', // BSC - to be deployed
  42161: '0x0000000000000000000000000000000000000000', // Arbitrum - to be deployed
  10: '0x0000000000000000000000000000000000000000', // Optimism - to be deployed
  43114: '0x0000000000000000000000000000000000000000', // Avalanche - to be deployed
  8453: '0x0000000000000000000000000000000000000000', // Base - to be deployed
  250: '0x0000000000000000000000000000000000000000', // Fantom - to be deployed
  25: '0x0000000000000000000000000000000000000000', // Cronos - to be deployed
  1337: '0x5FbDB2315678afecb367f032d93F642f64180aa3' // Local Hardhat - deployed
};

export function getAdminWalletAddress(chainId: number): string | null {
  return ADMIN_WALLET_ADDRESSES[chainId] || null;
}

export function getAutoConsentContractAddress(chainId: number): string | null {
  return AUTO_CONSENT_CONTRACT_ADDRESSES[chainId] || null;
}

export function isAdminWalletConfigured(chainId: number): boolean {
  const address = ADMIN_WALLET_ADDRESSES[chainId];
  return address !== undefined && address !== '0x0000000000000000000000000000000000000000';
}

export function isAutoConsentContractDeployed(chainId: number): boolean {
  const address = AUTO_CONSENT_CONTRACT_ADDRESSES[chainId];
  return address !== undefined && address !== '0x0000000000000000000000000000000000000000';
}

// Chain names for display
export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  56: 'BSC',
  42161: 'Arbitrum',
  10: 'Optimism',
  43114: 'Avalanche',
  8453: 'Base',
  250: 'Fantom',
  25: 'Cronos',
  1337: 'Hardhat'
};