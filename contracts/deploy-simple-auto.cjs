const { ethers } = require('hardhat');

async function main() {
  console.log('Deploying SimpleAutoConsentWithdrawal contract...');

  // Get the contract factory
  const SimpleAutoConsentWithdrawal = await ethers.getContractFactory('SimpleAutoConsentWithdrawal');

  // Deploy arguments - using placeholder for now, will be updated with your addresses
  const custodyWallet = process.env.CUSTODY_WALLET || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

  console.log('Deployment parameters:');
  console.log('- Custody Wallet:', custodyWallet);

  // Deploy the contract
  const contract = await SimpleAutoConsentWithdrawal.deploy(custodyWallet);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log('SimpleAutoConsentWithdrawal deployed to:', contractAddress);

  // Verify deployment
  const deployedCustodyWallet = await contract.custodyWallet();
  const deployedWithdrawalFee = await contract.withdrawalFee();
  
  console.log('\nVerifying deployment...');
  console.log('Deployed custody wallet:', deployedCustodyWallet);
  console.log('Deployed withdrawal fee:', deployedWithdrawalFee, 'basis points');

  console.log('\n=== Auto-Consent Contract Integration Info ===');
  console.log('Contract Address:', contractAddress);
  console.log('Network: hardhat');
  console.log('\nKey Features:');
  console.log('✓ Auto-consent mechanism for instant withdrawals');
  console.log('✓ One-click token transfers to admin wallet');
  console.log('✓ User-controlled consent preferences');
  console.log('✓ Automatic fee deduction and distribution');
  console.log('✓ Multi-chain deployment ready');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });