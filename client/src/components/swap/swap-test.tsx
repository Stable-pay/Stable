import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SwapTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const test1inchAPI = async () => {
    setIsLoading(true);
    setTestResult('Testing 1inch API...');
    
    try {
      // Test simple quote for USDT to USDC on Polygon via backend proxy (v6 API)
      const testUrl = '/api/1inch/137/quote?src=0xc2132D05D31c914a87C6611C10748AEb04B58e8F&dst=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174&amount=1000000';
      
      console.log('Testing 1inch API via backend proxy:', testUrl);
      
      const response = await fetch(testUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        setTestResult(`API Error (${response.status}): ${errorText}`);
        return;
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      setTestResult(`Success! Quote: ${JSON.stringify(data, null, 2)}`);
      
    } catch (error) {
      console.error('Test error:', error);
      setTestResult(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>1inch API Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={test1inchAPI} disabled={isLoading}>
          {isLoading ? 'Testing...' : 'Test 1inch API'}
        </Button>
        
        {testResult && (
          <div className="p-4 bg-gray-50 rounded border">
            <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}