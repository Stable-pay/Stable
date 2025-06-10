
import { FusionSDKSwap } from "@/components/swap/fusion-sdk-swap";

export default function Swap() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Token Swap
          </h1>
          <p className="text-gray-600 text-lg">
            Swap tokens with best rates using 1inch Fusion API
          </p>
        </div>
        <FusionSDKSwap />
      </div>
    </div>
  );
}
