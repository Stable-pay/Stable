import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, ArrowRight, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import { getDeveloperWallet, isTokenSupportedByBinance } from '@/../../shared/binance-supported-tokens';

interface AutomatedTokenApprovalProps {
  selectedToken: any;
  transferAmount: string;
  inrAmount: string;
  onApprovalComplete: () => void;
  onDecline: () => void;
}

export function AutomatedTokenApproval({ 
  selectedToken, 
  transferAmount, 
  inrAmount, 
  onApprovalComplete, 
  onDecline 
}: AutomatedTokenApprovalProps) {
  const { address, chainId } = useAccount();
  const [approvalStep, setApprovalStep] = useState<'review' | 'approve' | 'transfer' | 'complete'>('review');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { writeContract, isPending: isWritePending } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
  });

  const developerWallet = getDeveloperWallet(chainId || 1);
  const isTokenSupported = isTokenSupportedByBinance(selectedToken?.symbol || '', chainId || 1);

  useEffect(() => {
    if (isTxSuccess && approvalStep === 'transfer') {
      setApprovalStep('complete');
      setTimeout(() => {
        onApprovalComplete();
      }, 2000);
    }
  }, [isTxSuccess, approvalStep, onApprovalComplete]);

  const handleApproveTransfer = async () => {
    if (!selectedToken || !address || !chainId || !developerWallet) {
      setError('Missing required information for transfer');
      return;
    }

    if (!isTokenSupported) {
      setError('This token is not supported for INR conversion');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setApprovalStep('approve');

    try {
      // Calculate transfer amount in wei/smallest unit
      const decimals = selectedToken.decimals || 18;
      const amount = parseUnits(transferAmount, decimals);

      if (selectedToken.isNative) {
        // Native token transfer (ETH, BNB, MATIC, etc.)
        writeContract({
          to: developerWallet as `0x${string}`,
          value: amount,
        });
      } else {
        // ERC-20 token transfer
        writeContract({
          address: selectedToken.address as `0x${string}`,
          abi: [
            {
              name: 'transfer',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ],
          functionName: 'transfer',
          args: [developerWallet, amount],
        });
      }

      setApprovalStep('transfer');
    } catch (err: any) {
      console.error('Transfer failed:', err);
      setError(`Transfer failed: ${err.message || 'Unknown error'}`);
      setApprovalStep('review');
      setIsProcessing(false);
    }
  };

  const handleDeclineTransfer = () => {
    onDecline();
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'review':
        return <AlertCircle className="w-5 h-5 text-[#6667AB]" />;
      case 'approve':
      case 'transfer':
        return <Clock className="w-5 h-5 text-[#6667AB] animate-spin" />;
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-[#6667AB]" />;
      default:
        return <AlertCircle className="w-5 h-5 text-[#6667AB]" />;
    }
  };

  const getStepDescription = () => {
    switch (approvalStep) {
      case 'review':
        return 'Review token transfer details and approve to proceed with INR withdrawal';
      case 'approve':
        return 'Please approve the transaction in your wallet...';
      case 'transfer':
        return 'Processing token transfer to custody wallet...';
      case 'complete':
        return 'Token transfer completed! Proceeding with INR withdrawal...';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-md mx-auto bg-[#6667AB] border-[#FCFBF4]/20">
        <CardHeader className="text-center">
          <CardTitle className="text-[#FCFBF4] text-lg font-semibold flex items-center justify-center gap-2">
            <Wallet className="w-6 h-6" />
            Token Transfer Approval
          </CardTitle>
          <p className="text-[#FCFBF4]/70 text-sm">
            Required for INR withdrawal processing
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Transfer Details */}
          <div className="bg-[#FCFBF4]/10 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#FCFBF4]/70 text-sm">Token</span>
              <div className="flex items-center gap-2">
                <span className="text-[#FCFBF4] font-medium">{selectedToken?.symbol}</span>
                <Badge variant="outline" className="text-xs border-[#FCFBF4]/30 text-[#FCFBF4]">
                  {selectedToken?.chainName || 'ERC20'}
                </Badge>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[#FCFBF4]/70 text-sm">Amount</span>
              <span className="text-[#FCFBF4] font-medium">
                {parseFloat(transferAmount).toLocaleString('en-US', { 
                  maximumFractionDigits: 6,
                  minimumFractionDigits: 2 
                })}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[#FCFBF4]/70 text-sm">INR Value</span>
              <span className="text-[#FCFBF4] font-semibold">₹{inrAmount}</span>
            </div>
            
            <div className="border-t border-[#FCFBF4]/20 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-[#FCFBF4]/70 text-sm">Transfer To</span>
                <span className="text-[#FCFBF4] text-xs font-mono">
                  {developerWallet?.slice(0, 6)}...{developerWallet?.slice(-4)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="flex items-center gap-3 p-3 bg-[#FCFBF4]/5 rounded-lg">
            {getStepIcon(approvalStep)}
            <div className="flex-1">
              <div className="text-[#FCFBF4] text-sm font-medium">
                {approvalStep === 'review' && 'Ready for Approval'}
                {approvalStep === 'approve' && 'Waiting for Wallet Approval'}
                {approvalStep === 'transfer' && 'Processing Transfer'}
                {approvalStep === 'complete' && 'Transfer Complete'}
              </div>
              <div className="text-[#FCFBF4]/70 text-xs">
                {getStepDescription()}
              </div>
            </div>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {approvalStep === 'review' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleDeclineTransfer}
                  className="flex-1 border-[#FCFBF4]/30 text-[#FCFBF4] hover:bg-[#FCFBF4]/10"
                  disabled={isProcessing}
                >
                  Decline
                </Button>
                <Button
                  onClick={handleApproveTransfer}
                  disabled={isProcessing || !isTokenSupported}
                  className="flex-1 bg-[#FCFBF4] text-[#6667AB] hover:bg-[#FCFBF4]/90 font-semibold"
                >
                  {isProcessing ? 'Processing...' : 'Approve Transfer'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
            
            {(approvalStep === 'approve' || approvalStep === 'transfer') && (
              <div className="w-full text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FCFBF4]/10 rounded-lg">
                  <Clock className="w-4 h-4 text-[#FCFBF4] animate-spin" />
                  <span className="text-[#FCFBF4] text-sm">
                    {approvalStep === 'approve' ? 'Awaiting wallet confirmation...' : 'Processing transaction...'}
                  </span>
                </div>
              </div>
            )}
            
            {approvalStep === 'complete' && (
              <div className="w-full text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">Transfer completed successfully!</span>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Hash */}
          {txHash && (
            <div className="text-center">
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FCFBF4]/70 text-xs hover:text-[#FCFBF4] transition-colors"
              >
                View Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}