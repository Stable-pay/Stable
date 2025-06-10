
import { EnhancedSwapInterface } from "@/components/swap/enhanced-swap-interface";

export default function Swap() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Token Swap
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-xl max-w-2xl mx-auto">
            Swap tokens with the best rates across all decentralized exchanges. 
            Powered by 1inch Protocol with gasless options available.
          </p>
        </div>
        <EnhancedSwapInterface />
      </div>
    </div>
  );
}
