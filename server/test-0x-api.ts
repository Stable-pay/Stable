import { Request, Response } from 'express';

/**
 * Test endpoint to verify 0x Protocol API connectivity
 */
export async function test0xAPI(req: Request, res: Response) {
  try {
    const apiKey = '12be1743-8f3e-4867-a82b-501263f3c4b6';
    const baseURL = 'https://api.0x.org';
    
    // Test with a simple ETH to USDC quote
    const params = new URLSearchParams({
      chainId: '1',
      sellToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH
      buyToken: '0xA0b86a33E6441c49863dc7b4eA2b43DB5D31f0b2', // USDC on Ethereum
      sellAmount: '1000000000000000000', // 1 ETH
      takerAddress: '0x742d35Cc6601C08bD0c7E0E0F0f3e8e4f1B5B5b5',
      skipValidation: 'true'
    });

    console.log('Testing 0x API with URL:', `${baseURL}/swap/v1/quote?${params.toString()}`);

    const response = await fetch(`${baseURL}/swap/v1/quote?${params.toString()}`, {
      method: 'GET',
      headers: {
        '0x-api-key': apiKey,
        'Accept': 'application/json'
      }
    });

    console.log('0x API Response Status:', response.status);
    console.log('0x API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('0x API Error Response:', errorText);
      return res.status(response.status).json({
        error: '0x API Error',
        status: response.status,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('0x API Success Response:', data);

    res.json({
      success: true,
      message: '0x Protocol API is working correctly',
      quote: data,
      testParameters: {
        sellToken: 'ETH',
        buyToken: 'USDC', 
        sellAmount: '1 ETH',
        chainId: 1
      }
    });

  } catch (error) {
    console.error('Test 0x API Error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}