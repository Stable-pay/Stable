import { ReactNode } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { 
  mainnet, 
  polygon, 
  bsc, 
  arbitrum, 
  optimism, 
  base, 
  avalanche, 
  fantom, 
  celo, 
  moonbeam, 
  gnosis, 
  zkSync,
  solana,
  solanaTestnet,
  solanaDevnet
} from '@reown/appkit/networks';

// Use project ID from environment variables
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '8b3e608af3d7c16be89416c7d75bf157';

// Validate project ID
if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is required');
}

// Create adapters
const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  projectId,
  networks: [
    mainnet, 
    polygon, 
    bsc, 
    arbitrum, 
    optimism, 
    base, 
    avalanche, 
    fantom, 
    celo, 
    moonbeam, 
    gnosis, 
    zkSync
  ]
});

const solanaAdapter = new SolanaAdapter();

// Get current domain
const getCurrentDomain = () => {
  if (typeof window === 'undefined') return 'https://stablepay.replit.app';
  return window.location.origin;
};

// Create AppKit modal
const modal = createAppKit({
  adapters: [wagmiAdapter, solanaAdapter],
  projectId,
  networks: [
    mainnet, 
    polygon, 
    bsc, 
    arbitrum, 
    optimism, 
    base, 
    avalanche, 
    fantom, 
    celo, 
    moonbeam, 
    gnosis, 
    zkSync,
    solana,
    solanaTestnet,
    solanaDevnet
  ],
  defaultNetwork: mainnet,
  metadata: {
    name: 'StablePay',
    description: 'Multi-chain crypto to INR platform',
    url: getCurrentDomain(),
    icons: ['https://stablepay.replit.app/icon-192.png']
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#6667AB',
    '--w3m-border-radius-master': '12px',
    '--w3m-color-mix': '#FCFBF4',
    '--w3m-color-mix-strength': 20
  },
  features: {
    analytics: false,
    email: false,
    socials: [],
    emailShowWallets: false,
    swaps: false,
    onramp: false,
    history: true,
    allWallets: true
  },
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
  allowUnsupportedChain: true
});

interface AppKitProviderProps {
  children: ReactNode;
}

export function AppKitProvider({ children }: AppKitProviderProps) {
  return <>{children}</>;
}

export { wagmiAdapter, modal };
export const config = wagmiAdapter.wagmiConfig;