import { useState, useEffect } from 'react';
import { Copy, ExternalLink, AlertCircle } from 'lucide-react';

export function DomainSetup() {
  const [currentDomain, setCurrentDomain] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentDomain(window.location.origin);
    }
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openReownConsole = () => {
    window.open('https://cloud.reown.com/sign-in', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 space-y-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#6667AB] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Domain Configuration Required
          </h2>
          <p className="text-gray-600">
            To enable wallet connections, add your domain to the Reown project allowlist
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-[#FCFBF4] rounded-xl border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Domain (Copy this)
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono">
                {currentDomain}
              </code>
              <button
                onClick={() => copyToClipboard(currentDomain)}
                className="px-4 py-2 bg-[#6667AB] text-white rounded-lg hover:bg-[#5555AA] transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="p-4 bg-[#FCFBF4] rounded-xl border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project ID
            </label>
            <code className="block px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono">
              de08fceb9aec3c31d08270dd9eb71c65
            </code>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Setup Steps:</h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-[#6667AB] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Open Reown Cloud Console and sign in</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-[#6667AB] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Select your project with ID: de08fceb9aec3c31d08270dd9eb71c65</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-[#6667AB] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Go to Settings → Domains and add the domain above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-[#6667AB] text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>Save changes and refresh this page</span>
            </li>
          </ol>
        </div>

        <div className="flex gap-3">
          <button
            onClick={openReownConsole}
            className="flex-1 px-6 py-3 bg-[#6667AB] text-white rounded-xl hover:bg-[#5555AA] transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <ExternalLink className="w-5 h-5" />
            Open Reown Console
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 border border-[#6667AB] text-[#6667AB] rounded-xl hover:bg-[#FCFBF4] transition-colors font-medium"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}