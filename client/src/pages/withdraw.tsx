import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { EXCHANGE_RATES } from "@/lib/constants";

export default function Withdraw() {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [inrEquivalent, setInrEquivalent] = useState("0.00");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: ""
  });
  const { toast } = useToast();

  // Mock available balance
  const availableBalance = 2451.32;
  const dailyLimit = 50000;
  const todayUsed = 0;
  const transactionsToday = 0;
  const maxTransactionsPerDay = 3;

  // Calculate INR equivalent
  useEffect(() => {
    if (withdrawAmount) {
      const usdcAmount = parseFloat(withdrawAmount) || 0;
      const inrAmount = usdcAmount * EXCHANGE_RATES['USDC/INR'];
      setInrEquivalent(inrAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 }));
    } else {
      setInrEquivalent("0.00");
    }
  }, [withdrawAmount]);

  const handleQuickAmount = (amount: string) => {
    if (amount === "max") {
      setWithdrawAmount(availableBalance.toString());
    } else {
      setWithdrawAmount(amount);
    }
  };

  const handleBankDetailsChange = (field: string, value: string) => {
    setBankDetails(prev => ({ ...prev, [field]: value }));
    
    // Auto-fill bank name from IFSC (mock)
    if (field === 'ifscCode' && value.length >= 4) {
      const bankCodes: { [key: string]: string } = {
        'SBIN': 'State Bank of India',
        'HDFC': 'HDFC Bank',
        'ICIC': 'ICICI Bank',
        'AXIS': 'Axis Bank',
        'KOTAK': 'Kotak Mahindra Bank'
      };
      
      const bankCode = value.substring(0, 4).toUpperCase();
      const bankName = bankCodes[bankCode] || 'Unknown Bank';
      setBankDetails(prev => ({ ...prev, bankName }));
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    // Validation
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Withdrawal amount exceeds available balance",
        variant: "destructive",
      });
      return;
    }

    const inrAmount = amount * EXCHANGE_RATES['USDC/INR'];
    if (inrAmount > (dailyLimit - todayUsed)) {
      toast({
        title: "Daily Limit Exceeded",
        description: `Daily withdrawal limit of ₹${dailyLimit.toLocaleString()} exceeded`,
        variant: "destructive",
      });
      return;
    }

    if (transactionsToday >= maxTransactionsPerDay) {
      toast({
        title: "Transaction Limit Reached",
        description: "Maximum 3 transactions per day allowed",
        variant: "destructive",
      });
      return;
    }

    if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
      toast({
        title: "Incomplete Bank Details",
        description: "Please fill in all bank account details",
        variant: "destructive",
      });
      return;
    }

    setIsWithdrawing(true);

    try {
      // Simulate withdrawal processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Withdrawal Initiated",
        description: `₹${inrEquivalent} withdrawal has been initiated to your bank account`,
      });

      // Reset form
      setWithdrawAmount("");
      setInrEquivalent("0.00");
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: "Failed to process withdrawal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Withdraw to INR</h1>
        <p className="text-gray-600">Convert your USDC balance to INR and withdraw to your bank account</p>
      </div>

      {/* Available Balance Card */}
      <Card className="bg-gradient-to-r from-primary to-indigo-600 text-white">
        <CardContent className="p-8 text-center">
          <p className="text-indigo-200 mb-2">Available USDC Balance</p>
          <h3 className="text-4xl font-bold mb-2">{availableBalance.toLocaleString()}</h3>
          <p className="text-indigo-200">
            ≈ ₹{(availableBalance * EXCHANGE_RATES['USDC/INR']).toLocaleString('en-IN', { maximumFractionDigits: 2 })} INR
          </p>
        </CardContent>
      </Card>

      {/* Withdrawal Form */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Input */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-3">Withdrawal Amount</Label>
            <div className="border-2 border-gray-200 rounded-xl p-4 focus-within:border-primary">
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="border-0 text-2xl font-semibold p-0 h-auto focus-visible:ring-0"
                />
                <div className="flex items-center space-x-2 min-w-fit">
                  <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                    <i className="fas fa-dollar-sign text-white text-xs"></i>
                  </div>
                  <span className="font-medium">USDC</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                ≈ ₹{inrEquivalent} INR
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex space-x-2 mt-3">
              {["100", "500", "1000", "max"].map((amount) => (
                <Button
                  key={amount}
                  onClick={() => handleQuickAmount(amount)}
                  variant="outline"
                  size="sm"
                  className="hover:bg-gray-100"
                >
                  {amount === "max" ? "Max" : amount}
                </Button>
              ))}
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Bank Account Details</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  id="accountHolderName"
                  placeholder="As per bank records"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => handleBankDetailsChange('accountHolderName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="Enter account number"
                  value={bankDetails.accountNumber}
                  onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  placeholder="Enter IFSC code"
                  value={bankDetails.ifscCode}
                  onChange={(e) => handleBankDetailsChange('ifscCode', e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  placeholder="Will auto-fill from IFSC"
                  value={bankDetails.bankName}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Withdrawal Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Withdrawal Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">USDC Amount</span>
                <span className="font-medium">{withdrawAmount || "0.00"} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Exchange Rate</span>
                <span className="font-medium">1 USDC = ₹{EXCHANGE_RATES['USDC/INR']}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee</span>
                <span className="font-medium">₹25.00</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>You'll Receive</span>
                <span>₹{inrEquivalent ? (parseFloat(inrEquivalent.replace(/,/g, '')) - 25).toLocaleString('en-IN') : "0.00"}</span>
              </div>
            </div>
          </div>

          {/* Withdrawal Limits */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                <div>
                  <h5 className="font-medium text-blue-900 mb-1">Daily Limits</h5>
                  <p className="text-sm text-blue-700 mb-2">
                    Maximum ₹{dailyLimit.toLocaleString()} per day | {maxTransactionsPerDay} transactions per day | 12-hour cooldown between withdrawals
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-blue-600">
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      Today: ₹{todayUsed.toLocaleString()} / ₹{dailyLimit.toLocaleString()}
                    </Badge>
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      Transactions: {transactionsToday} / {maxTransactionsPerDay}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            onClick={handleWithdraw}
            disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || isWithdrawing || !bankDetails.accountNumber}
            className="w-full py-6 text-lg font-semibold"
            size="lg"
          >
            {isWithdrawing ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Processing Withdrawal...
              </>
            ) : (
              "Initiate Withdrawal"
            )}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Funds will be credited within T+0 to T+1 banking window
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
