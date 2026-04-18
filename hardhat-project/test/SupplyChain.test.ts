import { expect } from "chai";
import { ethers } from "hardhat";

describe("SupplyChain", function () {
  let SupplyChain: any;
  let supplyChain: any;
  let admin: any;
  let manufacturer: any;
  let distributor: any;
  let retailer: any;
  let customer: any;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    admin = signers[0];
    manufacturer = signers[1];
    distributor = signers[2];
    retailer = signers[3];
    customer = signers[4];

    SupplyChain = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment();
    
    // Assign roles
    // Deployer (admin) already gets MANUFACTURER in constructor
    await supplyChain.assignRole(manufacturer.address, 1); // MANUFACTURER
    await supplyChain.assignRole(distributor.address, 2); // DISTRIBUTOR
    await supplyChain.assignRole(retailer.address, 3); // RETAILER
  });

  describe("1. Deployment", function () {
    it("deployer is admin", async function () {
      expect(await supplyChain.admin()).to.equal(admin.address);
    });

    it("deployer has MANUFACTURER role", async function () {
      expect(await supplyChain.roles(admin.address)).to.equal(1);
    });

    it("total products starts at 0", async function () {
      expect(await supplyChain.getTotalProducts()).to.equal(0);
    });
  });

  describe("2. Role Assignment", function () {
    it("admin can assign DISTRIBUTOR role", async function () {
      await supplyChain.assignRole(customer.address, 2);
      expect(await supplyChain.roles(customer.address)).to.equal(2);
    });

    it("admin can assign RETAILER role", async function () {
      await supplyChain.assignRole(customer.address, 3);
      expect(await supplyChain.roles(customer.address)).to.equal(3);
    });

    it("non-admin cannot assign role", async function () {
      await expect(
        supplyChain.connect(manufacturer).assignRole(customer.address, 2)
      ).to.be.revertedWith("SupplyChain: Only admin can assign roles");
    });

    it("assigning NONE should revert only if the current contract enforces that", async function () {
      await expect(
        supplyChain.assignRole(customer.address, 0) // NONE
      ).to.be.revertedWith("SupplyChain: Cannot assign NONE role");
    });
  });

  describe("3. Add Product", function () {
    it("manufacturer can add product", async function () {
      await supplyChain.connect(manufacturer).addProduct("Laptop", "USA", "B123");
      const product = await supplyChain.getProduct(1);
      expect(product.name).to.equal("Laptop");
    });

    it("added product stores correct fields", async function () {
      await supplyChain.connect(manufacturer).addProduct("Phone", "China", "B456");
      const product = await supplyChain.getProduct(1);
      
      expect(product.id).to.equal(1);
      expect(product.name).to.equal("Phone");
      expect(product.origin).to.equal("China");
      expect(product.batchNumber).to.equal("B456");
      expect(product.currentOwner).to.equal(manufacturer.address);
      expect(product.status).to.equal(0); // CREATED
      expect(product.createdAt).to.be.gt(0);
    });

    it("addProduct emits ProductAdded", async function () {
      await expect(
        supplyChain.connect(manufacturer).addProduct("Tablet", "Japan", "B789")
      )
        .to.emit(supplyChain, "ProductAdded")
        .withArgs(1, manufacturer.address);
    });

    it("non-manufacturer cannot add product", async function () {
      await expect(
        supplyChain.connect(distributor).addProduct("Watch", "UK", "B111")
      ).to.be.revertedWith("SupplyChain: Unauthorized role");
    });

    it("history is created on add", async function () {
      await supplyChain.connect(manufacturer).addProduct("PC", "Taiwan", "B222");
      const history = await supplyChain.getHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0].actor).to.equal(manufacturer.address);
      expect(history[0].action).to.equal("Product Created");
    });
  });

  describe("4. Transfer Ownership", function () {
    beforeEach(async function () {
      await supplyChain.connect(manufacturer).addProduct("Car", "Germany", "B333");
    });

    it("current owner can transfer to valid registered role", async function () {
      await supplyChain.connect(manufacturer).transferOwnership(1, distributor.address);
      const product = await supplyChain.getProduct(1);
      expect(product.currentOwner).to.equal(distributor.address);
    });

    it("transferOwnership emits event", async function () {
      await expect(
        supplyChain.connect(manufacturer).transferOwnership(1, distributor.address)
      )
        .to.emit(supplyChain, "OwnershipTransferred")
        .withArgs(1, manufacturer.address, distributor.address);
    });

    it("current owner updates correctly", async function () {
      await supplyChain.connect(manufacturer).transferOwnership(1, distributor.address);
      const product = await supplyChain.getProduct(1);
      expect(product.currentOwner).to.equal(distributor.address);
    });

    it("transfer to zero address reverts", async function () {
      await expect(
        supplyChain.connect(manufacturer).transferOwnership(1, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("transfer to Role.NONE reverts", async function () {
      await expect(
        supplyChain.connect(manufacturer).transferOwnership(1, customer.address) // customer has NONE
      ).to.be.revertedWith("Recipient must have a valid role");
    });

    it("non-owner cannot transfer", async function () {
      await expect(
        supplyChain.connect(distributor).transferOwnership(1, retailer.address)
      ).to.be.revertedWith("SupplyChain: Not the product owner");
    });
  });

  describe("5. Update Status", function () {
    beforeEach(async function () {
      await supplyChain.connect(manufacturer).addProduct("Bike", "Italy", "B444");
    });

    it("owner can move CREATED -> IN_TRANSIT", async function () {
      await supplyChain.connect(manufacturer).updateStatus(1, 1); // IN_TRANSIT
      const product = await supplyChain.getProduct(1);
      expect(product.status).to.equal(1);
    });

    it("owner can move IN_TRANSIT -> DELIVERED", async function () {
      await supplyChain.connect(manufacturer).updateStatus(1, 1);
      await supplyChain.connect(manufacturer).updateStatus(1, 2); // DELIVERED
      const product = await supplyChain.getProduct(1);
      expect(product.status).to.equal(2);
    });

    it("owner can move DELIVERED -> SOLD", async function () {
      await supplyChain.connect(manufacturer).updateStatus(1, 1);
      await supplyChain.connect(manufacturer).updateStatus(1, 2);
      await supplyChain.connect(manufacturer).updateStatus(1, 3); // SOLD
      const product = await supplyChain.getProduct(1);
      expect(product.status).to.equal(3);
    });

    it("invalid jump transition reverts", async function () {
      await expect(
        supplyChain.connect(manufacturer).updateStatus(1, 2) // CREATED -> DELIVERED
      ).to.be.revertedWith("Invalid status transition");
    });

    it("cannot update after SOLD", async function () {
      await supplyChain.connect(manufacturer).updateStatus(1, 1); // IN_TRANSIT
      await supplyChain.connect(manufacturer).updateStatus(1, 2); // DELIVERED
      await supplyChain.connect(manufacturer).updateStatus(1, 3); // SOLD
      
      await expect(
        supplyChain.connect(manufacturer).updateStatus(1, 0) // CREATED
      ).to.be.revertedWith("Product already completed");
    });

    it("non-owner cannot update status", async function () {
      await expect(
        supplyChain.connect(distributor).updateStatus(1, 1)
      ).to.be.revertedWith("SupplyChain: Not the product owner");
    });
  });

  describe("6. Verify Product", function () {
    beforeEach(async function () {
      await supplyChain.connect(manufacturer).addProduct("Book", "UK", "B555");
    });

    it("existing product returns exists=true", async function () {
      const result = await supplyChain.verifyProduct(1);
      expect(result.exists).to.equal(true);
      expect(result.currentOwner).to.equal(manufacturer.address);
      expect(result.status).to.equal(0);
    });

    it("missing product ID reverts with Product does not exist", async function () {
      await expect(
        supplyChain.verifyProduct(99)
      ).to.be.revertedWith("Product does not exist");
    });
  });

  describe("7. Read Functions", function () {
    beforeEach(async function () {
      await supplyChain.connect(manufacturer).addProduct("Shoe", "Vietnam", "B666");
      await supplyChain.connect(manufacturer).updateStatus(1, 1); // IN_TRANSIT
    });

    it("getProduct returns correct struct", async function () {
      const product = await supplyChain.getProduct(1);
      expect(product.name).to.equal("Shoe");
      expect(product.origin).to.equal("Vietnam");
    });

    it("getHistory returns expected entries", async function () {
      const history = await supplyChain.getHistory(1);
      expect(history.length).to.equal(2);
      expect(history[0].action).to.equal("Product Created");
      expect(history[1].action).to.equal("Status Updated");
    });

    it("getTotalProducts increments correctly", async function () {
      expect(await supplyChain.getTotalProducts()).to.equal(1);
      await supplyChain.connect(manufacturer).addProduct("Shirt", "India", "B777");
      expect(await supplyChain.getTotalProducts()).to.equal(2);
    });
  });
});
