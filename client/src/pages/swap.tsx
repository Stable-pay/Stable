import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_NETWORKS, MOCK_TOKENS, EXCHANGE_RATES } from "@/lib/constants";
import { ArrowUpDown } from "lucide-react";

export default function Swap() {
  const [selectedNetwork, setSelectedNetwork] = useState(SUPPORTED_NETWORKS[0]);
  const [selectedToken, setSelectedToken] = useState(MOCK_TOKENS.ethereum[0]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("0.00");
  const [autoSend, setAutoSend] = useState(true);
  const [isSwapping, setIsSwapping] = useState(false);
  const { toast } = useToast();

  // Calculate USDC amount based on input
  useEffect(() => {
    if (fromAmount && selectedToken) {
      const rate = EXCHANGE_RATES[`${selectedToken.symbol}/USDC` as keyof typeof EXCHANGE_RATES] || 1;
      const calculated = parseFloat(fromAmount) * rate;
      setToAmount(calculated.toFixed(2));
    } else {
      setToAmount("0.00");
    }
  }, [fromAmount, selectedToken]);

  const handleNetworkChange = (network: typeof SUPPORTED_NETWORKS[0]) => {
    setSelectedNetwork(network);
    const tokens = MOCK_TOKENS[network.id as keyof typeof MOCK_TOKENS] || [];
    if (tokens.length > 0) {
      setSelectedToken(tokens[0]);
    }
  };

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to swap",
        variant: "destructive",
      });
      return;
    }

    setIsSwapping(true);

    try {
      // Simulate swap transaction
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Swap Successful",
        description: `Successfully swapped ${fromAmount} ${selectedToken.symbol} to ${toAmount} USDC`,
      });

      // Reset form
      setFromAmount("");
      setToAmount("0.00");
    } catch (error) {
      toast({
        title: "Swap Failed",
        description: "Transaction failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const availableTokens = MOCK_TOKENS[selectedNetwork.id as keyof typeof MOCK_TOKENS] || [];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Convert Tokens to USDC</h1>
        <p className="text-gray-600">Swap any supported token to USDC with automatic transfer to custody wallet</p>
      </div>

      {/* Main Swap Card */}
      <Card>
        <CardHeader>
          <CardTitle>Token Swap</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Network Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Select Network</Label>
            <div className="grid grid-cols-3 gap-3">
              {SUPPORTED_NETWORKS.slice(0, 6).map((network) => (
                <button
                  key={network.id}
                  onClick={() => handleNetworkChange(network)}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-1 transition-colors ${
                    selectedNetwork.id === network.id
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  <div className={`w-6 h-6 bg-gradient-to-r ${network.color} rounded-full flex items-center justify-center`}>
                    <i className={`${network.icon} text-white text-xs`}></i>
                  </div>
                  <span className={`text-xs font-medium ${
                    selectedNetwork.id === network.id ? "text-primary" : "text-gray-600"
                  }`}>
                    {network.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* From Token */}
          <div className="border-2 border-gray-200 rounded-xl p-4 focus-within:border-primary">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm text-gray-500">From</Label>
              <span className="text-sm text-gray-500">
                Balance: {selectedToken.balance}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Input
                type="number"
                placeholder="0.00"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="border-0 text-2xl font-semibold p-0 h-auto focus-visible:ring-0"
              />
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2 min-w-fit">
                <div className={`w-6 h-6 bg-gradient-to-r ${selectedNetwork.color} rounded-full flex items-center justify-center`}>
                  <i className={`${selectedToken.icon} text-white text-xs`}></i>
                </div>
                <span className="font-medium">{selectedToken.symbol}</span>
              </div>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <div className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowUpDown className="h-5 w-5 text-gray-600" />
            </div>
          </div>

          {/* To USDC */}
          <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm text-gray-500">To</Label>
              <span className="text-sm text-gray-500">Balance: 0.00</span>
            </div>
            <div className="flex items-center space-x-4">
              <Input
                type="text"
                value={toAmount}
                readOnly
                className="border-0 text-2xl font-semibold p-0 h-auto bg-transparent focus-visible:ring-0"
              />
              <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 min-w-fit">
                <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-white text-xs"></i>
                </div>
                <span className="font-medium">USDC</span>
              </div>
            </div>
          </div>

          {/* Swap Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rate</span>
              <span className="text-sm font-medium">
                1 {selectedToken.symbol} = {EXCHANGE_RATES[`${selectedToken.symbol}/USDC` as keyof typeof EXCHANGE_RATES] || 1} USDC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Slippage Tolerance</span>
              <Badge variant="outline" className="text-primary border-primary">0.5%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Network Fee</span>
              <span className="text-sm font-medium">~$12.45</span>
            </div>
          </div>

          {/* Auto-Send Toggle */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Switch
                id="auto-send"
                checked={autoSend}
                onCheckedChange={setAutoSend}
              />
              <div className="flex-1">
                <Label htmlFor="auto-send" className="font-medium text-blue-900 cursor-pointer">
                  Auto-send USDC to custody wallet
                </Label>
                <p className="text-sm text-blue-700 mt-1">
                  Automatically transfer swapped USDC to secure custody wallet for INR withdrawal eligibility
                </p>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={!fromAmount || parseFloat(fromAmount) <= 0 || isSwapping}
            className="w-full py-6 text-lg font-semibold"
            size="lg"
          >
            {isSwapping ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Processing Swap...
              </>
            ) : (
              "Review Swap"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
