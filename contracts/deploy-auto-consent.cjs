const { ethers } = require('hardhat');

async function main() {
  console.log('Deploying AutoConsentStablePayWithdrawal contract...');

  // Get the contract factory
  const AutoConsentStablePayWithdrawal = await ethers.getContractFactory('AutoConsentStablePayWithdrawal');

  // Deploy arguments - please provide your admin wallet addresses for each chain
  const custodyWallet = process.env.CUSTODY_WALLET || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const withdrawalFee = 100; // 1% fee in basis points

  console.log('Deployment parameters:');
  console.log('- Custody Wallet:', custodyWallet);
  console.log('- Withdrawal Fee:', withdrawalFee, 'basis points (1%)');

  // Deploy the contract
  const contract = await AutoConsentStablePayWithdrawal.deploy(custodyWallet, withdrawalFee);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log('AutoConsentStablePayWithdrawal deployed to:', contractAddress);

  // Verify deployment
  const deployedCustodyWallet = await contract.custodyWallet();
  const deployedWithdrawalFee = await contract.withdrawalFee();
  
  console.log('\nVerifying deployment...');
  console.log('Deployed custody wallet:', deployedCustodyWallet);
  console.log('Deployed withdrawal fee:', deployedWithdrawalFee, 'basis points');

  console.log('\n=== Contract Integration Info ===');
  console.log('Contract Address:', contractAddress);
  console.log('Network: hardhat');
  console.log('\nKey Features:');
  console.log('- Auto-consent mechanism for seamless withdrawals');
  console.log('- Instant token transfers to admin wallet');
  console.log('- User-controlled consent preferences');
  console.log('- Emergency pause/unpause functionality');
  console.log('- Fee collection system');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });