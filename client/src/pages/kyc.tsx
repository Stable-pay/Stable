import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function KYC() {
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | 'processing'>('pending');

  const handleKycVerification = () => {
    setKycStatus('processing');
    setTimeout(() => {
      setKycStatus('verified');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>KYC Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {kycStatus === 'verified' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                KYC verification completed successfully!
              </AlertDescription>
            </Alert>
          )}

          {kycStatus === 'processing' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Processing KYC verification...
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleKycVerification}
            disabled={kycStatus === 'processing' || kycStatus === 'verified'}
            className="w-full"
          >
            {kycStatus === 'processing' ? 'Processing...' : 
             kycStatus === 'verified' ? 'Verified' : 'Start KYC Verification'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}