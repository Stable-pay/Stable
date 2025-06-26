import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
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
} from '@reown/appkit/networks'

// Define additional network configurations (Reown AppKit will handle these via WalletConnect)
// For now, we'll focus on EVM chains that are fully supported
// Non-EVM chains like Solana, Bitcoin will be handled via wallet-specific connections
import { QueryClient } from '@tanstack/react-query'

// Create query client
export const queryClient = new QueryClient()

// Get project ID and domain verification from environment variables
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
export const domainVerificationId = import.meta.env.VITE_DOMAIN_VERIFICATION_ID

// Validate project ID with fallback
if (!projectId) {
  console.warn('VITE_WALLETCONNECT_PROJECT_ID is not set. Using demo mode.');
}

// Log domain verification for debugging
if (domainVerificationId) {
  console.log('Domain verification configured:', domainVerificationId.substring(0, 20) + '...');
}

// Enhanced domain configuration for Replit environments
const getDynamicDomain = () => {
  if (typeof window === 'undefined') return 'https://stablepay.replit.app';
  
  const currentOrigin = window.location.origin;
  // Handle Replit dev domains - add common patterns
  if (currentOrigin.includes('replit.dev') || 
      currentOrigin.includes('repl.co') || 
      currentOrigin.includes('worf.replit.dev')) {
    return currentOrigin;
  }
  return currentOrigin;
};

console.log('Reown AppKit initializing with project ID:', projectId ? projectId.substring(0, 8) + '...' : 'Demo mode');
console.log('Current domain:', typeof window !== 'undefined' ? window.location.origin : 'SSR mode');

// Set up the Wagmi Adapter for EVM chains
export const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  projectId: projectId || 'demo-project-id',
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
})

// Set up the Solana Adapter for Solana networks
export const solanaAdapter = new SolanaAdapter()

// Set up metadata with dynamic domain configuration
const metadata = {
  name: 'RemitPay - Web3 Remittance Platform',
  description: 'Send crypto to India instantly with live exchange rates and Web3 off-ramping',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://stablepay.replit.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Simplified configuration focusing on EVM chains with enhanced wallet support
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId || 'demo-project-id',
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
  ],
  defaultNetwork: mainnet,
  metadata: {
    name: 'StablePay',
    description: 'Multi-chain crypto to INR platform',
    url: getDynamicDomain(),
    icons: ['https://avatars.githubusercontent.com/u/179229932']
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
  allowUnsupportedChain: true,
  // Remove custom wallets to avoid 404 errors on external images
  customWallets: []
})

export const config = wagmiAdapter.wagmiConfig