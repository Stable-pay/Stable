import { useAppKit, useAppKitAccount, useAppKitState } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function WalletConnectionTest() {
  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const { open: isModalOpen } = useAppKitState();

  const handleConnectTest = () => {
    console.log('Testing wallet connection...');
    console.log('Modal open function:', typeof open);
    console.log('Current connection state:', { isConnected, address, isModalOpen });
    
    try {
      open();
      console.log('Modal open() called successfully');
    } catch (error) {
      console.error('Error opening modal:', error);
    }
  };

  const handleNetworkTest = () => {
    console.log('Testing network selection...');
    try {
      open({ view: 'Networks' });
      console.log('Network modal opened');
    } catch (error) {
      console.error('Error opening network modal:', error);
    }
  };

  const handleAccountTest = () => {
    console.log('Testing account modal...');
    try {
      open({ view: 'Account' });
      console.log('Account modal opened');
    } catch (error) {
      console.error('Error opening account modal:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-[#6667AB]">Wallet Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Project ID:</p>
          <p className="text-xs font-mono text-[#6667AB] break-all">
            8b3e608af3d7c16be89416c7d75bf157
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-600">Connection Status:</p>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          
          {address && (
            <p className="text-xs font-mono text-gray-500">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-600">Modal State:</p>
          <Badge variant={isModalOpen ? "default" : "secondary"}>
            {isModalOpen ? 'Open' : 'Closed'}
          </Badge>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleConnectTest}
            className="w-full bg-[#6667AB] hover:bg-[#5555AA]"
          >
            Test Connect Modal
          </Button>
          
          <Button 
            onClick={handleNetworkTest}
            variant="outline"
            className="w-full"
          >
            Test Network Modal
          </Button>
          
          <Button 
            onClick={handleAccountTest}
            variant="outline"
            className="w-full"
          >
            Test Account Modal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}