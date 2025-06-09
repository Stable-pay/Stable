import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon, arbitrum, base, optimism, bsc, avalanche } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Production Reown project configuration
const projectId = '421930fbeb871d753327b56943afe3ad'

// Get current domain for proper configuration
const metadata = {
  name: 'Stable Pay',
  description: 'Comprehensive Multi-Chain Token Swapping Platform',
  url: 'https://stable-pay.app',
  icons: ['https://stable-pay.app/favicon.ico']
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
    analytics: true,
    email: false,
    socials: [],
    onramp: false,
    swaps: true,
    history: true
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#3B82F6',
    '--w3m-border-radius-master': '8px'
  }
})

export const wagmiConfig = wagmiAdapter.wagmiConfig

// Export utilities for wallet operations
export { projectId }
export default appKit
