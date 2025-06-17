import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Wallet,
  Shield,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';

interface USDCApprovalInterfaceProps {
  usdcAmount: string;
  custodyWallet: string;
  onApprovalComplete?: (txHash: string) => void;
  onTransferComplete?: (txHash: string) => void;
  onError?: (error: string) => void;
}

interface ApprovalStatus {
  hasBalance: boolean;
  hasAllowance: boolean;
  currentBalance: string;
  currentAllowance: string;
  requiredAmount: string;
  usdcAddress: string;
}

export function USDCApprovalInterface({ 
  usdcAmount, 
  custodyWallet, 
  onApprovalComplete, 
  onTransferComplete, 
  onError 
}: USDCApprovalInterfaceProps) {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null);
  const [transferTxHash, setTransferTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check USDC balance and allowance status
  const checkApprovalStatus = async () => {
    if (!address || !chainId) return;

    setIsLoadingStatus(true);
    setError(null);

    try {
      const response = await fetch('/api/production-swap/validate-usdc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId,
          userAddress: address,
          amount: usdcAmount,
          custodyWallet
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check USDC status');
      }

      const data = await response.json();
      setApprovalStatus(data.validation);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Execute USDC approval transaction
  const executeApproval = async () => {
    if (!approvalStatus || !address || !window.ethereum) return;

    setIsApproving(true);
    setError(null);

    try {
      // Request approval transaction from user's wallet
      const provider = window.ethereum;
      
      // Generate approval transaction data
      const approvalTx = {
        to: approvalStatus.usdcAddress,
        data: `0x095ea7b3${custodyWallet.slice(2).padStart(64, '0')}${'f'.repeat(64)}`, // approve(spender, maxUint256)
        value: '0x0'
      };

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          ...approvalTx
        }]
      });

      setApprovalTxHash(txHash);
      onApprovalComplete?.(txHash);

      // Wait for transaction confirmation
      setTimeout(() => {
        checkApprovalStatus();
      }, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Approval failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsApproving(false);
    }
  };

  // Execute USDC transfer to custody wallet
  const executeTransfer = async () => {
    if (!approvalStatus || !address || !window.ethereum) return;

    setIsTransferring(true);
    setError(null);

    try {
      // Calculate transfer amount in wei (USDC has 6 decimals)
      const transferAmountWei = (parseFloat(usdcAmount) * 1000000).toString(16);
      
      // Generate transfer transaction data
      const transferTx = {
        to: approvalStatus.usdcAddress,
        data: `0xa9059cbb${custodyWallet.slice(2).padStart(64, '0')}${transferAmountWei.padStart(64, '0')}`, // transfer(to, amount)
        value: '0x0'
      };

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          ...transferTx
        }]
      });

      setTransferTxHash(txHash);
      onTransferComplete?.(txHash);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsTransferring(false);
    }
  };

  useEffect(() => {
    if (isConnected && address && chainId) {
      checkApprovalStatus();
    }
  }, [isConnected, address, chainId, usdcAmount, custodyWallet]);

  if (!isConnected) {
    return (
      <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-[#6667AB]/50 mx-auto mb-4" />
          <p className="text-[#6667AB] mb-4">Connect your wallet to proceed with USDC transfer</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingStatus) {
    return (
      <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#6667AB] mx-auto mb-4" />
          <p className="text-[#6667AB]">Checking USDC balance and allowance...</p>
        </CardContent>
      </Card>
    );
  }

  if (transferTxHash) {
    return (
      <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
        <CardHeader>
          <CardTitle className="text-[#6667AB] flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            USDC Transfer Completed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">Transfer Amount:</span>
                <span className="font-semibold text-[#6667AB]">{usdcAmount} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">Transaction Hash:</span>
                <span className="font-mono text-sm text-[#6667AB]">
                  {transferTxHash.slice(0, 10)}...{transferTxHash.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">Status:</span>
                <Badge className="bg-green-500 text-white">Completed</Badge>
              </div>
            </div>
          </div>
          <p className="text-[#6667AB]/80 text-sm text-center">
            Your USDC has been transferred to our custody wallet. INR withdrawal will be processed within 24 hours.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
      <CardHeader>
        <CardTitle className="text-[#6667AB] flex items-center gap-2">
          <Shield className="w-6 h-6" />
          USDC Transfer for INR Withdrawal
        </CardTitle>
        <p className="text-[#6667AB]/80 text-sm">
          Approve and transfer {usdcAmount} USDC to complete your INR withdrawal
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {approvalStatus && (
          <div className="space-y-4">
            {/* Balance Check */}
            <div className="bg-[#6667AB]/10 border border-[#6667AB]/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6667AB] font-medium">USDC Balance Check</span>
                {approvalStatus.hasBalance ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6667AB]/70">Current Balance:</span>
                  <span className="text-[#6667AB]">{approvalStatus.currentBalance} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6667AB]/70">Required Amount:</span>
                  <span className="text-[#6667AB]">{approvalStatus.requiredAmount} USDC</span>
                </div>
              </div>
            </div>

            {/* Approval Check */}
            <div className="bg-[#6667AB]/10 border border-[#6667AB]/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6667AB] font-medium">USDC Approval Status</span>
                {approvalStatus.hasAllowance ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                )}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6667AB]/70">Current Allowance:</span>
                  <span className="text-[#6667AB]">{approvalStatus.currentAllowance} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6667AB]/70">Custody Wallet:</span>
                  <span className="font-mono text-xs text-[#6667AB]">
                    {custodyWallet.slice(0, 6)}...{custodyWallet.slice(-4)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              {!approvalStatus.hasBalance && (
                <div className="text-center">
                  <p className="text-red-600 text-sm mb-2">Insufficient USDC balance</p>
                  <Button variant="outline" className="w-full" disabled>
                    Cannot Proceed - Insufficient Balance
                  </Button>
                </div>
              )}

              {approvalStatus.hasBalance && !approvalStatus.hasAllowance && !approvalTxHash && (
                <Button 
                  className="btn-premium w-full"
                  onClick={executeApproval}
                  disabled={isApproving}
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Approving USDC...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Approve USDC Transfer
                    </>
                  )}
                </Button>
              )}

              {approvalTxHash && !transferTxHash && (
                <div className="space-y-2">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-700 text-sm font-medium">Approval Confirmed</p>
                    <p className="text-green-600 text-xs">Transaction: {approvalTxHash.slice(0, 10)}...{approvalTxHash.slice(-8)}</p>
                  </div>
                  <Button 
                    className="btn-premium w-full"
                    onClick={executeTransfer}
                    disabled={isTransferring}
                  >
                    {isTransferring ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Transferring USDC...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Transfer {usdcAmount} USDC
                      </>
                    )}
                  </Button>
                </div>
              )}

              {approvalStatus.hasBalance && approvalStatus.hasAllowance && !transferTxHash && (
                <Button 
                  className="btn-premium w-full"
                  onClick={executeTransfer}
                  disabled={isTransferring}
                >
                  {isTransferring ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Transferring USDC...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Transfer {usdcAmount} USDC
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}