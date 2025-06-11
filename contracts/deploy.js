const { ethers } = require('hardhat');

async function main() {
  console.log('Deploying StablePayWithdrawal contract...');

  // Get the contract factory
  const StablePayWithdrawal = await ethers.getContractFactory('StablePayWithdrawal');

  // Deploy arguments
  const custodyWallet = process.env.CUSTODY_WALLET || '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e';
  const withdrawalFee = 100; // 1% fee in basis points

  console.log('Deployment parameters:');
  console.log('- Custody Wallet:', custodyWallet);
  console.log('- Withdrawal Fee:', withdrawalFee, 'basis points (1%)');

  // Deploy the contract
  const contract = await StablePayWithdrawal.deploy(custodyWallet, withdrawalFee);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log('StablePayWithdrawal deployed to:', contractAddress);

  // Verify deployment
  console.log('\nVerifying deployment...');
  const deployedCustodyWallet = await contract.custodyWallet();
  const deployedFee = await contract.withdrawalFee();
  
  console.log('Deployed custody wallet:', deployedCustodyWallet);
  console.log('Deployed withdrawal fee:', deployedFee.toString(), 'basis points');

  // Output contract info for frontend integration
  console.log('\n=== Contract Integration Info ===');
  console.log('Contract Address:', contractAddress);
  console.log('Network:', hre.network.name);
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });