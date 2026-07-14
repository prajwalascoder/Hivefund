import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying with account:", deployer.address);

  const FundVault = await hre.ethers.getContractFactory("FundVault");

  const vault = await FundVault.deploy(); // ✅ NO ARGUMENTS

  await vault.waitForDeployment();

  console.log("Vault deployed at:", await vault.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
