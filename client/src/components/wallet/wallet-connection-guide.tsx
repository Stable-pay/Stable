import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Download, Shield, Smartphone } from 'lucide-react';

export default function WalletConnectionGuide() {
  const wallets = [
    {
      name: 'MetaMask',
      description: 'Most popular Web3 wallet',
      url: 'https://metamask.io',
      icon: '🦊',
      platforms: ['Browser Extension', 'Mobile App']
    },
    {
      name: 'Coinbase Wallet',
      description: 'Secure wallet by Coinbase',
      url: 'https://wallet.coinbase.com',
      icon: '🔵',
      platforms: ['Browser Extension', 'Mobile App']
    },
    {
      name: 'Trust Wallet',
      description: 'Multi-chain mobile wallet',
      url: 'https://trustwallet.com',
      icon: '🛡️',
      platforms: ['Mobile App']
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <Download className="h-5 w-5" />
            Wallet Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-600 dark:text-orange-400 mb-4">
            To use this platform, you need a Web3 wallet installed. Choose one of the popular options below:
          </p>
          
          <div className="space-y-4">
            {wallets.map((wallet) => (
              <div key={wallet.name} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{wallet.icon}</div>
                  <div>
                    <h3 className="font-semibold">{wallet.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{wallet.description}</p>
                    <div className="flex gap-1 mt-1">
                      {wallet.platforms.map((platform) => (
                        <Badge key={platform} variant="secondary" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <a href={wallet.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Install
                  </a>
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
              <Shield className="h-4 w-4" />
              Security Tips
            </h4>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>• Never share your seed phrase with anyone</li>
              <li>• Always verify website URLs before connecting</li>
              <li>• Only download wallets from official sources</li>
              <li>• Keep your wallet software updated</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-medium flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
              <Smartphone className="h-4 w-4" />
              After Installation
            </h4>
            <p className="text-sm text-green-600 dark:text-green-400">
              Once you've installed a wallet, refresh this page and click the "Connect Wallet" button to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}