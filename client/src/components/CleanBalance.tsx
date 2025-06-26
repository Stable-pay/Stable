import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';

interface CleanBalanceProps {
  onTokenSelect: (token: any, amount: string, inrAmount: string) => void;
}

export function CleanBalance({ onTokenSelect }: CleanBalanceProps) {
  const { address, isConnected } = useAppKitAccount();
  const [inrAmount, setInrAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');

  const handleInrChange = (value: string) => {
    setInrAmount(value);
    if (value && parseFloat(value) > 0) {
      const ethPrice = 3000;
      const usdAmount = parseFloat(value) / 83.25;
      const ethAmount = usdAmount / ethPrice;
      setTokenAmount(ethAmount.toFixed(6));
    } else {
      setTokenAmount('');
    }
  };

  const handleContinue = () => {
    if (tokenAmount && inrAmount) {
      const tokenData = {
        symbol: 'ETH',
        name: 'Ethereum',
        balance: '1.0',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        chainId: 1,
        chainName: 'Ethereum',
        usdValue: 3000
      };
      
      onTokenSelect(tokenData, tokenAmount, inrAmount);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ 
        maxWidth: '600px',
        margin: '0 auto',
        padding: '32px',
        backgroundColor: '#FCFBF4',
        border: '1px solid rgba(102, 103, 171, 0.3)',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <div style={{ 
          width: '48px',
          height: '48px',
          margin: '0 auto 16px',
          backgroundColor: 'rgba(102, 103, 171, 0.5)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: '#FCFBF4'
        }}>
          💼
        </div>
        <p style={{ color: '#6667AB' }}>Connect your wallet to continue</p>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '600px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: '#FCFBF4',
      border: '1px solid rgba(102, 103, 171, 0.3)',
      borderRadius: '12px'
    }}>
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '24px',
        color: '#6667AB',
        fontSize: '20px',
        fontWeight: '600'
      }}>
        🪙 Convert ETH to INR
      </div>

      <div style={{ 
        backgroundColor: 'rgba(102, 103, 171, 0.1)',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <div style={{ fontSize: '14px', color: 'rgba(102, 103, 171, 0.7)', marginBottom: '8px' }}>
          Connected Wallet
        </div>
        <div style={{ 
          color: '#6667AB',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {address?.slice(0, 10)}...{address?.slice(-8)}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block',
          marginBottom: '8px',
          color: '#6667AB',
          fontWeight: '500'
        }}>
          Amount in INR
        </label>
        <input
          type="number"
          placeholder="Enter INR amount"
          value={inrAmount}
          onChange={(e) => handleInrChange(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid rgba(102, 103, 171, 0.3)',
            borderRadius: '8px',
            fontSize: '16px',
            backgroundColor: '#FCFBF4'
          }}
        />
      </div>

      {tokenAmount && (
        <div style={{ 
          backgroundColor: 'rgba(102, 103, 171, 0.1)',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ color: '#6667AB' }}>ETH Amount:</span>
            <span style={{ 
              fontWeight: '600',
              color: '#6667AB'
            }}>
              {tokenAmount} ETH
            </span>
          </div>
          <div style={{ 
            fontSize: '14px',
            color: 'rgba(102, 103, 171, 0.7)'
          }}>
            Rate: 1 USD = ₹83.25 | 1 ETH ≈ $3,000
          </div>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!inrAmount || !tokenAmount}
        style={{
          width: '100%',
          padding: '16px',
          backgroundColor: inrAmount && tokenAmount ? '#6667AB' : 'rgba(102, 103, 171, 0.5)',
          color: '#FCFBF4',
          border: 'none',
          borderRadius: '16px',
          fontSize: '16px',
          fontWeight: '500',
          cursor: inrAmount && tokenAmount ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        Continue to KYC →
      </button>
    </div>
  );
}

export default CleanBalance;