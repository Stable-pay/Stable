import { useAppKit, useAppKitState, useAppKitAccount } from '@reown/appkit/react'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, User, ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export function WalletConnectButton() {
  const { open, close } = useAppKit()
  const { open: isOpen, selectedNetworkId } = useAppKitState()
  const { address, isConnected, caipAddress, status } = useAppKitAccount()

  const handleConnect = () => {
    open()
  }

  const handleDisconnect = () => {
    open({ view: 'Account' })
  }

  const handleNetworkSwitch = () => {
    open({ view: 'Networks' })
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {/* Network Selector */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNetworkSwitch}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            {(() => {
               const networkId = selectedNetworkId?.split(':')[1];
               switch (networkId) {
                 case '1': return 'Ethereum';
                 case '137': return 'Polygon';
                 case '56': return 'BSC';
                 case '42161': return 'Arbitrum';
                 default: return 'Network';
               }
             })()}
            <ChevronDown className="w-3 h-3" />
          </div>
        </Button>

        {/* Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <User className="w-4 h-4 mr-2" />
              {address.slice(0, 6)}...{address.slice(-4)}
              <ChevronDown className="w-3 h-3 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-gray-800 border-gray-700">
            <div className="px-3 py-2">
              <p className="text-sm text-gray-300">Connected Wallet</p>
              <p className="text-xs text-gray-500 font-mono">{address}</p>
            </div>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem onClick={() => open({ view: 'Account' })} className="text-white hover:bg-gray-700">
              <User className="w-4 h-4 mr-2" />
              Account Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => open({ view: 'Networks' })} className="text-white hover:bg-gray-700">
              <div className="w-4 h-4 mr-2 bg-blue-500 rounded-full"></div>
              Switch Network
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem onClick={handleDisconnect} className="text-red-400 hover:bg-gray-700">
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <Button 
      onClick={handleConnect}
      disabled={status === 'connecting'}
      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  )
}

export function WalletConnectionCard() {
  const { open } = useAppKit()
  const { isConnected, address } = useAppKitAccount()

  if (isConnected) {
    return (
      <Card className="bg-green-500/20 border-green-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-medium">Wallet Connected</p>
              <p className="text-white/60 text-sm font-mono">{address?.slice(0, 12)}...{address?.slice(-6)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-blue-500/20 border-blue-500/30">
      <CardContent className="p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
          <Wallet className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h3 className="text-white font-medium mb-2">Connect Your Wallet</h3>
          <p className="text-white/60 text-sm mb-4">
            Connect with 350+ wallets including MetaMask, Rainbow, Coinbase Wallet, and more
          </p>
          <Button 
            onClick={() => open()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
          <p className="text-white/40 text-xs mt-2">
            Supports social login via Google, Apple, X, Discord, and more
          </p>
        </div>
      </CardContent>
    </Card>
  )
}