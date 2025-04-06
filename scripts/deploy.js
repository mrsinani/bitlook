import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Voting contract...");

  // Deploy the contract
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();

  await voting.waitForDeployment();
  const address = await voting.getAddress();

  console.log(`Voting contract deployed to: ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 