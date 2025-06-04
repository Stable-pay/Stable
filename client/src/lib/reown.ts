import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet, polygon, bsc, base, avalanche, arbitrum, optimism } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Production Reown project configuration
const projectId = '6dfca9af31141b1fb9220aa7db3eee37'

// Get current domain for proper configuration
const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://stable-pay.app'

// Configure supported networks for multi-chain DeFi
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  polygon,
  bsc,
  base,
  avalanche,
  arbitrum,
  optimism
]

// Create EVM adapter with enhanced configuration
const ethersAdapter = new EthersAdapter()

// Create the AppKit instance with native swapping enabled
export const appKit = createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks,
  metadata: {
    name: 'Stable Pay',
    description: 'Multi-Chain USDC Platform with Native Reown Swapping',
    url: currentUrl,
    icons: [`${currentUrl}/favicon.ico`]
  },
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'x', 'github', 'discord'],
    onramp: true,
    swaps: true,
    history: true,
    emailShowWallets: true
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-font-family': 'Inter, system-ui, sans-serif',
    '--w3m-accent': '#3B82F6',
    '--w3m-color-mix': '#3B82F6',
    '--w3m-color-mix-strength': 20,
    '--w3m-border-radius-master': '8px',
    '--w3m-z-index': 2147483647
  },
  allowUnsupportedChain: false,
  allWallets: 'SHOW'
})

// Export utilities for wallet operations
export { projectId }
export default appKit
