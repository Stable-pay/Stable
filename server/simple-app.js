const express = require('express');
const path = require('path');
const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(express.static('client'));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StablePay - Automatic Token Transfer</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', system-ui, sans-serif; background-color: #6667AB; min-height: 100vh; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 3rem; font-weight: bold; color: white; margin-bottom: 16px; }
        .header p { color: rgba(255,255,255,0.8); font-size: 1.1rem; }
        .card { background-color: #FCFBF4; border-radius: 12px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
        .card h2 { color: #6667AB; margin-bottom: 24px; font-size: 1.5rem; }
        .info-section { color: #6667AB; margin-bottom: 24px; }
        .token-info { font-size: 0.9rem; margin-bottom: 16px; }
        .token-info div { margin-bottom: 4px; }
        .wallet-address { font-size: 0.8rem; margin-top: 8px; word-break: break-all; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .form-field { margin-bottom: 16px; }
        .form-field label { display: block; margin-bottom: 8px; font-weight: 600; color: #6667AB; font-size: 0.9rem; }
        .form-field input { width: 100%; padding: 12px 16px; border-radius: 8px; border: 2px solid rgba(102, 103, 171, 0.3); background-color: white; color: #6667AB; font-weight: 500; min-height: 48px; font-size: 16px; }
        .btn { width: 100%; background: linear-gradient(135deg, #6667AB 0%, #8B5FBF 100%); color: #FCFBF4; border: none; border-radius: 8px; padding: 12px 24px; font-size: 1rem; font-weight: 600; cursor: pointer; min-height: 48px; box-shadow: 0 4px 15px rgba(102, 103, 171, 0.4); transition: all 0.3s ease; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(102, 103, 171, 0.6); }
        .btn:disabled { background: rgba(102, 103, 171, 0.5); cursor: not-allowed; transform: none; }
        .transfer-summary { background-color: #6667AB; color: white; padding: 20px; border-radius: 8px; margin-bottom: 24px; }
        .transfer-summary .title { font-weight: 600; margin-bottom: 12px; font-size: 1.1rem; }
        .developer-info { font-size: 0.9rem; margin-top: 12px; opacity: 0.8; word-break: break-all; }
        .success-message { background-color: #6667AB; color: white; padding: 20px; border-radius: 8px; margin-top: 24px; }
        .success-message .title { font-weight: 600; font-size: 1.1rem; margin-bottom: 8px; }
        .hidden { display: none; }
        .spinner { width: 16px; height: 16px; margin-right: 8px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .header h1 { font-size: 2rem; } .card { padding: 24px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>StablePay</h1>
            <p>Convert your crypto to INR automatically</p>
        </div>

        <div id="landing-step" class="card">
            <h2>Get Started with StablePay</h2>
            <div class="info-section">
                <p>Connect your wallet to start converting crypto to INR</p>
                <div class="token-info">
                    <div>• Selected Token: ETH</div>
                    <div>• Amount: 1.0</div>
                    <div>• Estimated INR: ₹83.25</div>
                    <div class="wallet-address">• Will transfer to: 0x0f9947c3e98c59975a033843d90cc1ecc17f06f3</div>
                </div>
            </div>
            <button class="btn" onclick="startKyc()">Connect Wallet & Start KYC</button>
        </div>

        <div id="kyc-step" class="card hidden">
            <h2>Complete KYC & Bank Details</h2>
            <div class="form-grid">
                <div class="form-field">
                    <label>Account Number</label>
                    <input type="text" id="accountNumber" placeholder="Enter account number">
                </div>
                <div class="form-field">
                    <label>IFSC Code</label>
                    <input type="text" id="ifscCode" placeholder="Enter IFSC code">
                </div>
                <div class="form-field">
                    <label>Account Holder Name</label>
                    <input type="text" id="accountHolderName" placeholder="Enter full name">
                </div>
                <div class="form-field">
                    <label>Bank Name</label>
                    <input type="text" id="bankName" placeholder="Enter bank name">
                </div>
            </div>
            <button class="btn" id="completeKycBtn" onclick="completeKyc()" disabled>Complete KYC</button>
        </div>

        <div id="transfer-step" class="card hidden">
            <h2>Automatic Token Transfer & INR Withdrawal</h2>
            <div class="transfer-summary">
                <div class="title">Transfer Summary</div>
                <div>Token: ETH</div>
                <div>Amount: 1.0</div>
                <div>INR Value: ₹83.25</div>
                <div class="developer-info">Will transfer to developer wallet: 0x0f9947c3e98c59975a033843d90cc1ecc17f06f3</div>
            </div>
            <button class="btn" id="transferBtn" onclick="executeAutoTransfer()">Complete Verification & Convert to INR</button>
            <div id="success-message" class="success-message hidden">
                <div class="title">Transfer Complete!</div>
                <div>Token transferred automatically to developer wallet</div>
                <div>INR bank transfer initiated: ₹83.25</div>
            </div>
        </div>
    </div>

    <script>
        function startKyc() {
            document.getElementById('landing-step').classList.add('hidden');
            document.getElementById('kyc-step').classList.remove('hidden');
            validateKycForm();
        }

        function validateKycForm() {
            const accountNumber = document.getElementById('accountNumber').value;
            const ifscCode = document.getElementById('ifscCode').value;
            const accountHolderName = document.getElementById('accountHolderName').value;
            const completeKycBtn = document.getElementById('completeKycBtn');
            
            if (accountNumber && ifscCode && accountHolderName) {
                completeKycBtn.disabled = false;
            } else {
                completeKycBtn.disabled = true;
            }
        }

        function completeKyc() {
            document.getElementById('kyc-step').classList.add('hidden');
            document.getElementById('transfer-step').classList.remove('hidden');
        }

        async function executeAutoTransfer() {
            const transferBtn = document.getElementById('transferBtn');
            transferBtn.innerHTML = '<div style="display: flex; align-items: center; justify-content: center;"><div class="spinner"></div>Processing Transfer...</div>';
            transferBtn.disabled = true;
            
            try {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const response = await fetch('/api/withdrawal/initiate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userAddress: '0x1234567890123456789012345678901234567890',
                        tokenSymbol: 'ETH',
                        tokenAmount: '1.0',
                        chainId: 1,
                        transferHash: \`TRANSFER_\${Date.now()}\`,
                        inrAmount: '83.25',
                        bankDetails: {
                            accountNumber: document.getElementById('accountNumber').value,
                            ifscCode: document.getElementById('ifscCode').value,
                            accountHolderName: document.getElementById('accountHolderName').value,
                            bankName: document.getElementById('bankName').value
                        }
                    })
                });

                if (response.ok) {
                    document.getElementById('success-message').classList.remove('hidden');
                    transferBtn.style.display = 'none';
                } else {
                    throw new Error('API request failed');
                }
            } catch (error) {
                console.error('Transfer failed:', error);
                transferBtn.innerHTML = 'Transfer Failed - Try Again';
                transferBtn.disabled = false;
            }
        }

        document.getElementById('accountNumber').addEventListener('input', validateKycForm);
        document.getElementById('ifscCode').addEventListener('input', validateKycForm);
        document.getElementById('accountHolderName').addEventListener('input', validateKycForm);
        document.getElementById('bankName').addEventListener('input', validateKycForm);
    </script>
</body>
</html>
  `);
});

// API endpoint for withdrawal initiation
app.post('/api/withdrawal/initiate', (req, res) => {
  const { userAddress, tokenSymbol, tokenAmount, chainId, transferHash, inrAmount, bankDetails } = req.body;
  
  console.log('Withdrawal initiated:', {
    userAddress,
    tokenSymbol,
    tokenAmount,
    chainId,
    transferHash,
    inrAmount,
    bankDetails,
    developerWallet: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3'
  });
  
  // Simulate successful processing
  res.json({
    success: true,
    message: 'Token transfer and INR withdrawal initiated successfully',
    transferHash,
    inrAmount,
    developerWallet: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3'
  });
});

app.listen(port, () => {
  console.log(`StablePay server running at http://localhost:${port}`);
});