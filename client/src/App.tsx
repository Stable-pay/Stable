import React, { useState } from 'react';

function App() {
  const [step, setStep] = useState<'landing' | 'kyc' | 'transfer'>('landing');
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [tokenAmount, setTokenAmount] = useState('1.0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: ''
  });

  const handleConnectWallet = () => {
    setStep('kyc');
  };

  const handleKycComplete = () => {
    setStep('transfer');
  };

  const handleAutoTransferWithdrawal = async () => {
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const inrAmount = (parseFloat(tokenAmount) * 83.25).toFixed(2);
      
      const response = await fetch('/api/withdrawal/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: '0x1234567890123456789012345678901234567890',
          tokenSymbol: selectedToken,
          tokenAmount: tokenAmount,
          chainId: 1,
          transferHash: `TRANSFER_${Date.now()}`,
          inrAmount: inrAmount,
          bankDetails: bankDetails
        })
      });

      if (response.ok) {
        setTransferComplete(true);
      }
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#6667AB',
      padding: '20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '16px',
            margin: '0 0 16px 0'
          }}>
            StablePay
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.8)', 
            fontSize: '1.1rem',
            margin: '0'
          }}>
            Convert your crypto to INR automatically
          </p>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {step === 'landing' && (
            <div style={{ 
              backgroundColor: '#FCFBF4',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ 
                color: '#6667AB', 
                marginBottom: '24px', 
                fontSize: '1.5rem',
                margin: '0 0 24px 0'
              }}>
                Get Started with StablePay
              </h2>
              <div style={{ color: '#6667AB', marginBottom: '24px' }}>
                <p style={{ marginBottom: '16px' }}>
                  Connect your wallet to start converting crypto to INR
                </p>
                <div style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                  <div>• Selected Token: {selectedToken}</div>
                  <div>• Amount: {tokenAmount}</div>
                  <div>• Estimated INR: ₹{(parseFloat(tokenAmount) * 83.25).toFixed(2)}</div>
                  <div style={{ marginTop: '8px', fontSize: '0.8rem' }}>
                    • Will transfer to: 0x742d35Cc6634C0532925a3b8D73ee1b6b1f4f82D
                  </div>
                </div>
              </div>
              <button 
                onClick={handleConnectWallet}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #6667AB 0%, #8B5FBF 100%)',
                  color: '#FCFBF4',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minHeight: '48px',
                  boxShadow: '0 4px 15px rgba(102, 103, 171, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                Connect Wallet & Start KYC
              </button>
            </div>
          )}

          {step === 'kyc' && (
            <div style={{ 
              backgroundColor: '#FCFBF4',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ 
                color: '#6667AB', 
                marginBottom: '24px', 
                fontSize: '1.5rem',
                margin: '0 0 24px 0'
              }}>
                Complete KYC & Bank Details
              </h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px', 
                marginBottom: '24px' 
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    color: '#6667AB',
                    fontSize: '0.9rem'
                  }}>
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="Enter account number"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid rgba(102, 103, 171, 0.3)',
                      backgroundColor: 'white',
                      color: '#6667AB',
                      fontWeight: '500',
                      minHeight: '48px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    color: '#6667AB',
                    fontSize: '0.9rem'
                  }}>
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                    placeholder="Enter IFSC code"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid rgba(102, 103, 171, 0.3)',
                      backgroundColor: 'white',
                      color: '#6667AB',
                      fontWeight: '500',
                      minHeight: '48px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    color: '#6667AB',
                    fontSize: '0.9rem'
                  }}>
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={bankDetails.accountHolderName}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                    placeholder="Enter full name"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid rgba(102, 103, 171, 0.3)',
                      backgroundColor: 'white',
                      color: '#6667AB',
                      fontWeight: '500',
                      minHeight: '48px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    color: '#6667AB',
                    fontSize: '0.9rem'
                  }}>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="Enter bank name"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid rgba(102, 103, 171, 0.3)',
                      backgroundColor: 'white',
                      color: '#6667AB',
                      fontWeight: '500',
                      minHeight: '48px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              <button 
                onClick={handleKycComplete}
                disabled={!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName}
                style={{
                  width: '100%',
                  background: (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) 
                    ? 'rgba(102, 103, 171, 0.5)' 
                    : 'linear-gradient(135deg, #6667AB 0%, #8B5FBF 100%)',
                  color: '#FCFBF4',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) 
                    ? 'not-allowed' : 'pointer',
                  minHeight: '48px',
                  boxShadow: '0 4px 15px rgba(102, 103, 171, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                Complete KYC
              </button>
            </div>
          )}

          {step === 'transfer' && (
            <div style={{ 
              backgroundColor: '#FCFBF4',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ 
                color: '#6667AB', 
                marginBottom: '24px', 
                fontSize: '1.5rem',
                margin: '0 0 24px 0'
              }}>
                Automatic Token Transfer & INR Withdrawal
              </h2>
              
              <div style={{ 
                backgroundColor: '#6667AB', 
                color: 'white', 
                padding: '20px', 
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '1.1rem' }}>
                  Transfer Summary
                </div>
                <div>Token: {selectedToken}</div>
                <div>Amount: {tokenAmount}</div>
                <div>INR Value: ₹{(parseFloat(tokenAmount) * 83.25).toFixed(2)}</div>
                <div style={{ fontSize: '0.9rem', marginTop: '12px', opacity: 0.8 }}>
                  Will transfer to developer wallet: 0x742d35Cc6634C0532925a3b8D73ee1b6b1f4f82D
                </div>
              </div>
              
              <button 
                onClick={handleAutoTransferWithdrawal}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  background: isProcessing 
                    ? 'rgba(102, 103, 171, 0.5)' 
                    : 'linear-gradient(135deg, #6667AB 0%, #8B5FBF 100%)',
                  color: '#FCFBF4',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  minHeight: '48px',
                  boxShadow: '0 4px 15px rgba(102, 103, 171, 0.4)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isProcessing ? (
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      marginRight: '8px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></span>
                    Processing Transfer...
                  </span>
                ) : (
                  'Complete Verification & Convert to INR'
                )}
              </button>

              {transferComplete && (
                <div style={{ 
                  backgroundColor: '#6667AB', 
                  color: 'white', 
                  padding: '20px', 
                  borderRadius: '8px',
                  marginTop: '24px'
                }}>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>Transfer Complete!</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '8px' }}>
                    Token transferred automatically to developer wallet
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                    INR bank transfer initiated: ₹{(parseFloat(tokenAmount) * 83.25).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
}

export default App;