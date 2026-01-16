import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const FundVault = await hre.ethers.getContractFactory("FundVault");

  const vault = await FundVault.deploy(
    deployer.address,              // creator
    hre.ethers.parseEther("1"),    // goal = 1 ETH
    60                              // 1 minute deadline
  );

  await vault.waitForDeployment();

  console.log("Vault deployed at:", await vault.getAddress());
}

main();
