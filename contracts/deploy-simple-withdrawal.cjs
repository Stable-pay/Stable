const hre = require("hardhat");

async function main() {
  console.log("Deploying SimpleTokenWithdrawal contract...");

  const SimpleTokenWithdrawal = await hre.ethers.getContractFactory("SimpleTokenWithdrawal");
  const contract = await SimpleTokenWithdrawal.deploy();

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("SimpleTokenWithdrawal deployed to:", contractAddress);
  
  // Test contract functionality
  const owner = await contract.owner();
  const adminWallet = await contract.adminWallet();
  console.log("Contract owner:", owner);
  console.log("Admin wallet:", adminWallet);
  
  // Test USDC rate
  const usdcRate = await contract.tokenToInrRate("0xa0b86a33E6e3b0c8c8D7d45B40b9B5BA0b3d0E8B");
  console.log("USDC to INR rate:", hre.ethers.formatUnits(usdcRate, 18));
  
  return {
    address: contractAddress,
    owner: owner,
    adminWallet: adminWallet
  };
}

main()
  .then((result) => {
    console.log("Deployment completed successfully");
    console.log("Contract details:", result);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
  });