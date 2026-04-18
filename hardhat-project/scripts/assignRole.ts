import { ethers } from "hardhat";

async function main() {
    const [admin] = await ethers.getSigners();

    console.log("Admin account:", admin.address);

    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // keep yours

    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const contract = SupplyChain.attach(contractAddress);

    // 👇 PUT YOUR CURRENT METAMASK WALLET HERE
    const targetWallet = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

    // Role enum:
    // 0 = NONE
    // 1 = MANUFACTURER
    // 2 = SHIPPER
    // 3 = RETAILER

    const tx = await contract.assignRole(targetWallet, 1); // 1 = MANUFACTURER
    await tx.wait();

    console.log("Role assigned successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});