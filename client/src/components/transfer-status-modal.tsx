import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, ExternalLink, Copy } from 'lucide-react';

interface TransferStatusProps {
  isOpen: boolean;
  onClose: () => void;
  transferHash: string | null;
  tokenSymbol: string;
  amount: string;
  inrAmount: string;
  bankAccount: string;
  adminWallet: string;
  chainId: number;
  step: 'idle' | 'validating' | 'approving' | 'transferring' | 'completed' | 'error';
  error?: string;
}

export function TransferStatusModal({
  isOpen,
  onClose,
  transferHash,
  tokenSymbol,
  amount,
  inrAmount,
  bankAccount,
  adminWallet,
  chainId,
  step,
  error
}: TransferStatusProps) {
  const [copied, setCopied] = useState(false);

  const getExplorerUrl = (hash: string) => {
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io/tx/',
      137: 'https://polygonscan.com/tx/',
      56: 'https://bscscan.com/tx/',
      42161: 'https://arbiscan.io/tx/',
      10: 'https://optimistic.etherscan.io/tx/',
      8453: 'https://basescan.org/tx/',
    };
    return `${explorers[chainId] || explorers[1]}${hash}`;
  };

  const getChainName = (chainId: number) => {
    const chains: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BSC',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
    };
    return chains[chainId] || 'Unknown';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStepIcon = (currentStep: string) => {
    switch (currentStep) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getStepText = (currentStep: string) => {
    switch (currentStep) {
      case 'validating':
        return 'Validating token balance and permissions...';
      case 'approving':
        return 'Waiting for token approval...';
      case 'transferring':
        return 'Processing token transfer...';
      case 'completed':
        return 'Transfer completed successfully!';
      case 'error':
        return `Transfer failed: ${error}`;
      default:
        return 'Preparing transfer...';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStepIcon(step)}
            Token Transfer Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transfer Details */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Token:</span>
              <span className="font-medium text-gray-900 dark:text-white">{tokenSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white">{amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">INR Value:</span>
              <span className="font-medium text-gray-900 dark:text-white">₹{inrAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Network:</span>
              <span className="font-medium text-gray-900 dark:text-white">{getChainName(chainId)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Bank Account:</span>
              <span className="font-medium text-gray-900 dark:text-white">***{bankAccount.slice(-4)}</span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            {getStepIcon(step)}
            <span className="text-sm text-gray-900 dark:text-white">
              {getStepText(step)}
            </span>
          </div>

          {/* Transaction Hash */}
          {transferHash && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Transaction Hash:
              </label>
              <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <code className="text-xs flex-1 text-gray-900 dark:text-white">
                  {transferHash.slice(0, 10)}...{transferHash.slice(-8)}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(transferHash)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(getExplorerUrl(transferHash), '_blank')}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Admin Wallet Info */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Custody Wallet:
            </label>
            <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <code className="text-xs flex-1 text-gray-900 dark:text-white">
                {adminWallet.slice(0, 6)}...{adminWallet.slice(-4)}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(adminWallet)}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {step === 'completed' && (
              <Button 
                onClick={onClose}
                className="flex-1"
              >
                Continue to Bank Transfer
              </Button>
            )}
            {(step === 'error' || step === 'idle') && (
              <Button 
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            )}
          </div>

          {/* Information */}
          {step === 'completed' && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm text-green-800 dark:text-green-200">
              ✅ Your tokens have been securely transferred to our custody wallet. The INR amount will be processed to your bank account within 2-3 business days.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}