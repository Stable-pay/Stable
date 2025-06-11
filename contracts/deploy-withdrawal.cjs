const hre = require("hardhat");

async function main() {
  console.log("Deploying TokenWithdrawalContract...");

  const TokenWithdrawalContract = await hre.ethers.getContractFactory("TokenWithdrawalContract");
  const contract = await TokenWithdrawalContract.deploy();

  await contract.deployed();

  console.log("TokenWithdrawalContract deployed to:", contract.address);
  
  // Update token addresses for the current network
  const networkId = await hre.network.provider.send("eth_chainId");
  console.log("Network ID:", networkId);
  
  // Set up common tokens for the network
  if (networkId === "0x1") { // Ethereum Mainnet
    console.log("Setting up Ethereum mainnet tokens...");
    // USDC, USDT, ETH are already set in constructor
  } else if (networkId === "0x89") { // Polygon
    console.log("Setting up Polygon tokens...");
    await contract.setTokenAllowed("0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", true); // USDC
    await contract.setTokenAllowed("0xc2132D05D31c914a87C6611C10748AEb04B58e8F", true); // USDT
    await contract.setTokenAllowed("0x0000000000000000000000000000000000001010", true); // MATIC
  } else if (networkId === "0x38") { // BSC
    console.log("Setting up BSC tokens...");
    await contract.setTokenAllowed("0x8AC76a51cc950d9822D68b83fE1Ad97B32CD580d", true); // USDC
    await contract.setTokenAllowed("0x55d398326f99059fF775485246999027B3197955", true); // USDT
    await contract.setTokenAllowed("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", true); // BNB
  }
  
  return contract.address;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});