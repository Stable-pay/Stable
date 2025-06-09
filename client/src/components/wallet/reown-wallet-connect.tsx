import { useAppKit } from '@reown/appkit/react'
import { useAccount, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut } from 'lucide-react'

export function ReownWalletConnect() {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-mono"
          onClick={() => open()}
        >
          <Wallet className="h-3 w-3 mr-1" />
          {formatAddress(address)}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => disconnect()}
          className="h-8 w-8 p-0"
        >
          <LogOut className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => open()}
      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
      size="sm"
    >
      <Wallet className="h-4 w-4 mr-2" />
      Connect Wallet
    </Button>
  )
}