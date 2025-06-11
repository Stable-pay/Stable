import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface DirectTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferState: {
    isTransferring: boolean;
    transactionHash: string | null;
    error: string | null;
    step: 'idle' | 'preparing' | 'signing' | 'confirming' | 'completed' | 'error';
  };
  tokenSymbol: string;
  amount: string;
  chainId: number;
}

const getExplorerUrl = (chainId: number, txHash: string): string => {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/tx/',
    137: 'https://polygonscan.com/tx/',
    56: 'https://bscscan.com/tx/',
    42161: 'https://arbiscan.io/tx/',
    10: 'https://optimistic.etherscan.io/tx/',
    43114: 'https://snowtrace.io/tx/'
  };
  return `${explorers[chainId] || 'https://etherscan.io/tx/'}${txHash}`;
};

const getStepMessage = (step: string): string => {
  switch (step) {
    case 'preparing':
      return 'Preparing transaction...';
    case 'signing':
      return 'Please sign the transaction in your wallet';
    case 'confirming':
      return 'Transaction sent, waiting for confirmation...';
    case 'completed':
      return 'Transfer completed successfully!';
    case 'error':
      return 'Transfer failed';
    default:
      return 'Initializing...';
  }
};

export function DirectTransferModal({
  isOpen,
  onClose,
  transferState,
  tokenSymbol,
  amount,
  chainId
}: DirectTransferModalProps) {
  const { isTransferring, transactionHash, error, step } = transferState;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'completed' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : step === 'error' ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            )}
            Token Transfer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Transferring {amount} {tokenSymbol} to custody wallet
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              {step === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : step === 'error' ? (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm">{getStepMessage(step)}</p>
                {error && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>

          {transactionHash && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Transaction Hash:</p>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono">
                <span className="truncate">{transactionHash}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2"
                  onClick={() => window.open(getExplorerUrl(chainId, transactionHash), '_blank')}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {step === 'completed' || step === 'error' ? (
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full"
                disabled={isTransferring}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}