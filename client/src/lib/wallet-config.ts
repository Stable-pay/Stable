import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon, arbitrum, base, optimism, bsc, avalanche } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Production Reown project configuration
const projectId = '6dfca9af31141b1fb9220aa7db3eee37'

// Dynamic metadata configuration
const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://stable-pay.app';
const metadata = {
  name: 'StablePay',
  description: 'Multi-Chain DeFi Platform',
  url: currentUrl,
  icons: [`${currentUrl}/icon.png`]
}

// Supported networks
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet, 
  polygon, 
  arbitrum, 
  base, 
  optimism, 
  bsc, 
  avalanche
]

// Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  projectId,
  networks
})

// Clean AppKit configuration
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
  themeMode: 'dark'
})

export const wagmiConfig = wagmiAdapter.wagmiConfig
export { projectId }
export default appKit