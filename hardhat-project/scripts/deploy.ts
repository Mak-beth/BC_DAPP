import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  const SupplyChain = await ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  
  await supplyChain.waitForDeployment();
  const contractAddress = await supplyChain.getAddress();

  console.log(`SupplyChain deployed to: ${contractAddress}`);

  // Paths
  const artifactsPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "SupplyChain.sol",
    "SupplyChain.json"
  );
  
  const frontendDbPath = path.join(__dirname, "..", "..", "frontend", "public", "abi");
  const abiFile = path.join(frontendDbPath, "SupplyChain.json");
  const envFile = path.join(__dirname, "..", "..", "frontend", ".env.local");

  // Write ABI
  if (!fs.existsSync(frontendDbPath)) {
    fs.mkdirSync(frontendDbPath, { recursive: true });
  }

  const contractArtifactFile = fs.readFileSync(artifactsPath, "utf-8");
  const contractArtifact = JSON.parse(contractArtifactFile) as { abi: any[], contractName: string };

  const abiData = {
    abi: contractArtifact.abi,
    contractName: "SupplyChain"
  };

  fs.writeFileSync(abiFile, JSON.stringify(abiData, null, 2));
  console.log(`ABI successfully written to ${abiFile}`);

  // Write .env.local
  let envContent = "";
  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, "utf-8");
  }

  const envLines = envContent.split("\n");
  const NEXT_PUBLIC_CONTRACT_ADDRESS_PATTERN = /^NEXT_PUBLIC_CONTRACT_ADDRESS=/;
  
  let envVarFound = false;
  for (let i = 0; i < envLines.length; i++) {
    if (NEXT_PUBLIC_CONTRACT_ADDRESS_PATTERN.test(envLines[i])) {
      envLines[i] = `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`;
      envVarFound = true;
      break;
    }
  }

  if (!envVarFound) {
    if (envLines.length > 0 && envLines[envLines.length - 1] !== "") {
      envLines.push("");
    }
    envLines.push(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  }

  fs.writeFileSync(envFile, envLines.join("\n").trim() + "\n");
  console.log(`Updated frontend .env.local with contract address`);

  // Assign roles to known dev accounts
  const signers = await ethers.getSigners();
  const distributor = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Account #1
  const retailer    = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // Account #2

  // Account #0 (deployer) is already MANUFACTURER from the constructor
  console.log(`Manufacturer (deployer): ${signers[0].address}`);

  const tx1 = await supplyChain.assignRole(distributor, 2);
  await tx1.wait();
  console.log(`Distributor role assigned to: ${distributor}`);

  const tx2 = await supplyChain.assignRole(retailer, 3);
  await tx2.wait();
  console.log(`Retailer role assigned to:    ${retailer}`);
}

main().catch((error: Error) => {
  console.error(error);
  process.exit(1);
});
