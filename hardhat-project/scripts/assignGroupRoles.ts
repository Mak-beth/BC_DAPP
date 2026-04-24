import { ethers } from "hardhat";

async function main() {
  const [admin] = await ethers.getSigners();
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const SupplyChain = await ethers.getContractFactory("SupplyChain");
  const contract = SupplyChain.attach(contractAddress) as any;

  // 👇 PASTE YOUR TEAM'S WALLET ADDRESSES HERE
  const team = [
    { name: "Abubaker", address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", role: 1 }, // MANUFACTURER
    { name: "Taha", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", role: 1 }, // MANUFACTURER
    { name: "Ibrahim", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", role: 2 }, // DISTRIBUTOR
    { name: "Noor", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", role: 3 }, // RETAILER
  ];

  console.log("Assigning roles to group members...");

  for (const member of team) {
    if (member.address === "0x...") {
      console.log(`⚠️ Skipping ${member.name} (Address not provided)`);
      continue;
    }

    try {
      const tx = await contract.assignRole(member.address, member.role);
      await tx.wait();
      console.log(`✅ ${member.name} (${member.address}) assigned role ${member.role}`);
    } catch (error: any) {
      console.error(`❌ Failed to assign role to ${member.name}:`, error.message);
    }
  }

  console.log("\nDone!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
