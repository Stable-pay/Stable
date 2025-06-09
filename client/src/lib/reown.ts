import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon, arbitrum, base, optimism, bsc, avalanche } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Production Reown project configuration
const projectId = '421930fbeb871d753327b56943afe3ad'

// Get current domain for proper configuration
const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://stable-pay.app';
const metadata = {
  name: 'Stable Pay',
  description: 'Comprehensive Multi-Chain Token Swapping Platform',
  url: currentUrl,
  icons: [`${currentUrl}/favicon.ico`]
}

// Configure all supported networks for comprehensive blockchain integration
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet, 
  polygon, 
  arbitrum, 
  base, 
  optimism, 
  bsc, 
  avalanche
]

// Create Wagmi adapter for real wallet connections
const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  projectId,
  networks
})

// Create the AppKit instance for real wallet integration
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: false,
    onramp: false,
    swaps: false,
    history: true
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#10B981',
    '--w3m-border-radius-master': '12px',
    '--w3m-background-color': '#1E293B',
    '--w3m-foreground-color': '#F8FAFC'
  }
})

export const wagmiConfig = wagmiAdapter.wagmiConfig

// Export utilities for wallet operations
export { projectId }
export default appKit
