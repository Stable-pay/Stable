const { ethers } = require('hardhat');

async function main() {
  console.log('Deploying StablePayWithdrawal contract...');

  // Get the contract factory
  const StablePayWithdrawal = await ethers.getContractFactory('StablePayWithdrawal');

  // Deploy arguments
  const feeCollectorAddress = process.env.FEE_COLLECTOR_ADDRESS || '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e'; // Replace with your fee collector

  // Deploy the contract
  const contract = await StablePayWithdrawal.deploy(feeCollectorAddress);
  await contract.deployed();

  console.log('StablePayWithdrawal deployed to:', contract.address);
  console.log('Fee collector set to:', feeCollectorAddress);

  // Verify the contract on Etherscan if not on localhost
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 1337 && network.chainId !== 31337) {
    console.log('Waiting for block confirmations...');
    await contract.deployTransaction.wait(6);
    
    try {
      await hre.run('verify:verify', {
        address: contract.address,
        constructorArguments: [feeCollectorAddress],
      });
      console.log('Contract verified on Etherscan');
    } catch (error) {
      console.log('Verification failed:', error.message);
    }
  }

  // Set admin wallets for different chains (you'll need to call these manually)
  console.log('\nTo configure admin wallets, call the following functions:');
  console.log(`contract.setAdminWallet(1, "YOUR_ETHEREUM_ADMIN_WALLET");`);
  console.log(`contract.setAdminWallet(137, "YOUR_POLYGON_ADMIN_WALLET");`);
  console.log(`contract.setAdminWallet(56, "YOUR_BSC_ADMIN_WALLET");`);
  console.log(`contract.setAdminWallet(42161, "YOUR_ARBITRUM_ADMIN_WALLET");`);
  console.log(`contract.setAdminWallet(10, "YOUR_OPTIMISM_ADMIN_WALLET");`);
  console.log(`contract.setAdminWallet(8453, "YOUR_BASE_ADMIN_WALLET");`);

  return contract.address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });