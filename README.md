# 🔗 Blockchain Supply Chain DApp — Group 13

A premium, role-based supply chain tracking application built on Ethereum. This platform ensures transparency, authenticity, and immutable logging from manufacturing to final sale.

## ✨ Features
- **Blockchain Core:** Smart contracts for ownership, status tracking, and history.
- **Role-Based Access:** Unique interfaces for Manufacturers, Distributors, and Retailers.
- **IoT Integration:** Real-time on-chain logging of temperature and humidity (Phase 23).
- **Product Verification:** QR-code based verification for end consumers.
- **IPFS Integration:** Secure document/certification storage (Phase 15).
- **Advanced UI:** Premium dark-theme (Nebula/Aurora/Obsidian) with smooth animations (Framer Motion).

## 🛠️ Tech Stack
- **Smart Contracts:** Solidity, Hardhat, Ethers.js
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database:** MySQL (for off-chain metadata)
- **State Management:** Zustand
- **Animations:** Framer Motion, Lucide React

## 🚀 Getting Started

### 1. Setup Backend & Chain
1. Start your local MySQL database (e.g., via XAMPP).
2. Create the database: `CREATE DATABASE supplychain;`
3. Navigate to `hardhat-project`:
   ```bash
   npm install
   npx hardhat node
   ```
4. Deploy the contract:
   ```bash
   npx hardhat run scripts/deploy.ts --network localhost
   ```

### 2. Setup Frontend
1. Navigate to `frontend`:
   ```bash
   npm install
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 User Guide
For detailed instructions on setting up **MetaMask**, importing **Test Accounts**, and understanding **Roles**, please see the:
👉 **[Detailed User & Role Guide](enhancement-plan/README.md)**

---

## 👥 Group 13
- NOOR KHALIL ABDULLAH KHALED (TP078880)
- TAHA FAHD AHMED MOHAMMED THABIT (TP078281)
- ABUBAKER ELSIDDIG TAGELDEEN SIDDIG (TP078003)
- MUHMMAD AHMED KHAN (TP069769)
