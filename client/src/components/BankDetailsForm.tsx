import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Building, CreditCard, Shield } from 'lucide-react';

interface BankDetailsFormProps {
  onComplete: () => void;
}

export function BankDetailsForm({ onComplete }: BankDetailsFormProps) {
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    accountType: '',
    branchName: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const popularBanks = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Bank of Baroda',
    'Punjab National Bank',
    'Canara Bank',
    'Union Bank of India',
    'Bank of India',
    'Indian Bank',
    'Central Bank of India',
    'Indian Overseas Bank',
    'UCO Bank',
    'Bank of Maharashtra',
    'Punjab & Sind Bank'
  ];

  const isFormValid = () => {
    return (
      formData.bankName &&
      formData.accountNumber &&
      formData.confirmAccountNumber &&
      formData.ifscCode &&
      formData.accountHolderName &&
      formData.accountType &&
      formData.accountNumber === formData.confirmAccountNumber
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-[#FCFBF4] border-0 shadow-2xl">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl text-[#6667AB] flex items-center justify-center gap-3">
          <Building className="w-6 h-6" />
          Bank Account Details
        </CardTitle>
        <p className="text-[#6667AB]/70 mt-2">
          Add your bank account for INR withdrawals
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Notice */}
        <div className="bg-[#6667AB]/10 border border-[#6667AB]/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#6667AB]" />
            <div>
              <p className="text-[#6667AB] font-medium text-sm">Secure & Encrypted</p>
              <p className="text-[#6667AB]/70 text-xs">Your bank details are protected with bank-grade encryption</p>
            </div>
          </div>
        </div>

        {/* Bank Selection */}
        <div className="space-y-2">
          <Label className="text-[#6667AB] font-medium">Bank Name</Label>
          <Select value={formData.bankName} onValueChange={(value) => handleInputChange('bankName', value)}>
            <SelectTrigger className="border-[#6667AB]/30 bg-white">
              <SelectValue placeholder="Select your bank" />
            </SelectTrigger>
            <SelectContent>
              {popularBanks.map((bank) => (
                <SelectItem key={bank} value={bank}>
                  {bank}
                </SelectItem>
              ))}
              <SelectItem value="other">Other Bank</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[#6667AB] font-medium">Account Number</Label>
            <Input
              type="number"
              value={formData.accountNumber}
              onChange={(e) => handleInputChange('accountNumber', e.target.value)}
              placeholder="Enter account number"
              className="border-[#6667AB]/30 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#6667AB] font-medium">Confirm Account Number</Label>
            <Input
              type="number"
              value={formData.confirmAccountNumber}
              onChange={(e) => handleInputChange('confirmAccountNumber', e.target.value)}
              placeholder="Re-enter account number"
              className="border-[#6667AB]/30 bg-white"
            />
          </div>
        </div>

        {/* IFSC and Account Holder */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[#6667AB] font-medium">IFSC Code</Label>
            <Input
              value={formData.ifscCode}
              onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
              placeholder="Enter IFSC code"
              className="border-[#6667AB]/30 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#6667AB] font-medium">Account Type</Label>
            <Select value={formData.accountType} onValueChange={(value) => handleInputChange('accountType', value)}>
              <SelectTrigger className="border-[#6667AB]/30 bg-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="savings">Savings Account</SelectItem>
                <SelectItem value="current">Current Account</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Account Holder Name */}
        <div className="space-y-2">
          <Label className="text-[#6667AB] font-medium">Account Holder Name</Label>
          <Input
            value={formData.accountHolderName}
            onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
            placeholder="Enter name as per bank records"
            className="border-[#6667AB]/30 bg-white"
          />
        </div>

        {/* Branch Name */}
        <div className="space-y-2">
          <Label className="text-[#6667AB] font-medium">Branch Name (Optional)</Label>
          <Input
            value={formData.branchName}
            onChange={(e) => handleInputChange('branchName', e.target.value)}
            placeholder="Enter branch name"
            className="border-[#6667AB]/30 bg-white"
          />
        </div>

        {/* Validation Messages */}
        {formData.accountNumber && formData.confirmAccountNumber && formData.accountNumber !== formData.confirmAccountNumber && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">Account numbers do not match</p>
          </div>
        )}

        {/* Summary Card */}
        {isFormValid() && (
          <div className="bg-gradient-to-r from-[#6667AB]/10 to-[#6667AB]/5 border border-[#6667AB]/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="w-5 h-5 text-[#6667AB]" />
              <h3 className="font-medium text-[#6667AB]">Bank Account Summary</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">Bank:</span>
                <span className="text-[#6667AB] font-medium">{formData.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">Account:</span>
                <span className="text-[#6667AB] font-medium">****{formData.accountNumber.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">IFSC:</span>
                <span className="text-[#6667AB] font-medium">{formData.ifscCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">Holder:</span>
                <span className="text-[#6667AB] font-medium">{formData.accountHolderName}</span>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={onComplete}
          disabled={!isFormValid()}
          className="w-full bg-gradient-to-r from-[#6667AB] to-[#6667AB]/90 hover:from-[#6667AB]/90 hover:to-[#6667AB]/80 text-[#FCFBF4] rounded-2xl h-14 text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
        >
          Complete Setup & Withdraw INR
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default BankDetailsForm;