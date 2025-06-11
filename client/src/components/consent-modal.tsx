import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Shield, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: () => void;
  tokenSymbol: string;
  amount: string;
  inrAmount: string;
  adminWallet: string;
}

export function ConsentModal({
  isOpen,
  onClose,
  onConsent,
  tokenSymbol,
  amount,
  inrAmount,
  adminWallet
}: ConsentModalProps) {
  const [agreements, setAgreements] = useState({
    transfer: false,
    fees: false,
    terms: false,
    risks: false
  });

  const allAgreed = Object.values(agreements).every(Boolean);

  const handleAgreementChange = (key: keyof typeof agreements, checked: boolean) => {
    setAgreements(prev => ({ ...prev, [key]: checked }));
  };

  const handleConsent = () => {
    if (allAgreed) {
      onConsent();
      onClose();
    }
  };

  const handleClose = () => {
    setAgreements({
      transfer: false,
      fees: false,
      terms: false,
      risks: false
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Token Transfer Consent
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Transaction Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Token Amount:</span>
                <span className="font-medium">{amount} {tokenSymbol}</span>
              </div>
              <div className="flex justify-between">
                <span>INR Amount:</span>
                <span className="font-medium">₹{inrAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Admin Wallet:</span>
                <span className="font-mono text-xs">{adminWallet}</span>
              </div>
            </div>
          </div>

          {/* Risk Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This action will transfer your tokens to our admin wallet for conversion to INR. 
              Please ensure you understand the process before proceeding.
            </AlertDescription>
          </Alert>

          {/* Consent Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="transfer"
                checked={agreements.transfer}
                onCheckedChange={(checked) => handleAgreementChange('transfer', checked as boolean)}
              />
              <label htmlFor="transfer" className="text-sm leading-relaxed">
                I authorize the transfer of <strong>{amount} {tokenSymbol}</strong> from my wallet to the admin wallet 
                ({adminWallet}) for INR conversion purposes.
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="fees"
                checked={agreements.fees}
                onCheckedChange={(checked) => handleAgreementChange('fees', checked as boolean)}
              />
              <label htmlFor="fees" className="text-sm leading-relaxed">
                I understand that network fees (gas fees) will be deducted from my wallet for this transaction 
                and acknowledge potential conversion fees may apply.
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={agreements.terms}
                onCheckedChange={(checked) => handleAgreementChange('terms', checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm leading-relaxed">
                I agree to the terms of service and understand that this transaction is irreversible once 
                confirmed on the blockchain.
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="risks"
                checked={agreements.risks}
                onCheckedChange={(checked) => handleAgreementChange('risks', checked as boolean)}
              />
              <label htmlFor="risks" className="text-sm leading-relaxed">
                I acknowledge the risks associated with cryptocurrency transactions including market volatility, 
                network congestion, and potential technical issues.
              </label>
            </div>
          </div>

          {/* Additional Information */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Your tokens will be transferred to our secure admin wallet</li>
                  <li>We will convert your tokens to INR at current market rates</li>
                  <li>INR will be deposited to your verified bank account within 24-48 hours</li>
                  <li>You'll receive transaction confirmations via email</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConsent}
            disabled={!allAgreed}
            className="bg-green-600 hover:bg-green-700"
          >
            I Consent to Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}