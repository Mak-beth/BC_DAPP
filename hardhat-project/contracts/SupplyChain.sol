// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract SupplyChain {
    enum Role { NONE, MANUFACTURER, DISTRIBUTOR, RETAILER }
    enum Status { CREATED, IN_TRANSIT, DELIVERED, SOLD }

    struct Product {
        uint256 id;
        string name;
        string origin;
        string batchNumber;
        address currentOwner;
        Status status;
        uint256 createdAt;
    }

    struct HistoryEntry {
        address actor;
        string action;
        uint256 timestamp;
    }

    struct CertificationEntry {
        string cid;
        string fileName;
        uint256 timestamp;
        address uploader;
    }

    mapping(address => Role) public roles;
    mapping(uint256 => Product) public products;
    mapping(uint256 => HistoryEntry[]) private history;
    mapping(uint256 => CertificationEntry[]) private certifications;

    struct SensorEntry {
        int256 temperature; // stored in tenths of °C (e.g. 245 = 24.5 °C)
        uint256 humidity;   // 0–100 (percentage)
        uint256 timestamp;
        address logger;
    }

    mapping(uint256 => SensorEntry[]) private sensorReadings;

    struct RecallEntry {
        bool    active;
        string  reason;
        address issuedBy;
        uint256 timestamp;
    }

    mapping(uint256 => RecallEntry) public recalls;

    uint256 private productCounter;
    address public immutable admin;

    event RoleAssigned(address indexed user, Role role);
    event ProductAdded(uint256 indexed id, address indexed manufacturer);
    event OwnershipTransferred(uint256 indexed id, address from, address to);
    event StatusUpdated(uint256 indexed id, Status status);
    event CertificationAdded(uint256 indexed productId, string cid, address indexed uploader);
    event SensorReading(
        uint256 indexed productId,
        int256  temperature,
        uint256 humidity,
        uint256 timestamp,
        address indexed logger
    );
    event ProductRecalled(uint256 indexed productId, string reason, address indexed issuedBy);
    event RecallLifted(uint256 indexed productId, address indexed liftedBy);

    modifier onlyRole(Role role) {
        require(roles[msg.sender] == role, "SupplyChain: Unauthorized role");
        _;
    }

    modifier onlyOwner(uint256 productId) {
        require(products[productId].id != 0, "SupplyChain: Product does not exist");
        require(products[productId].currentOwner == msg.sender, "SupplyChain: Not the product owner");
        _;
    }

    modifier productExists(uint256 id) {
        require(id > 0 && id <= productCounter, "Product does not exist");
        _;
    }

    constructor() {
        admin = msg.sender;
        roles[msg.sender] = Role.MANUFACTURER;
    }

    function assignRole(address user, Role role) external {
        require(msg.sender == admin, "SupplyChain: Only admin can assign roles");
        require(role != Role.NONE, "SupplyChain: Cannot assign NONE role");
        
        roles[user] = role;
        emit RoleAssigned(user, role);
    }

    function addProduct(
        string memory name, 
        string memory origin, 
        string memory batchNumber
    ) external onlyRole(Role.MANUFACTURER) {
        require(bytes(name).length > 0, "SupplyChain: Product name is required");
        require(bytes(origin).length > 0, "SupplyChain: Origin is required");
        require(bytes(batchNumber).length > 0, "SupplyChain: Batch number is required");

        productCounter++;
        uint256 newId = productCounter;

        products[newId] = Product({
            id: newId,
            name: name,
            origin: origin,
            batchNumber: batchNumber,
            currentOwner: msg.sender,
            status: Status.CREATED,
            createdAt: block.timestamp
        });

        history[newId].push(HistoryEntry({
            actor: msg.sender,
            action: "Product Created",
            timestamp: block.timestamp
        }));

        emit ProductAdded(newId, msg.sender);
    }

    function transferOwnership(uint256 id, address to) external productExists(id) onlyOwner(id) {
        require(to != address(0), "Invalid recipient address");
        require(roles[to] != Role.NONE, "Recipient must have a valid role");
        require(to != msg.sender, "SupplyChain: Cannot transfer to self");
        
        address from = products[id].currentOwner;
        products[id].currentOwner = to;

        history[id].push(HistoryEntry({
            actor: msg.sender,
            action: "Ownership Transferred",
            timestamp: block.timestamp
        }));

        emit OwnershipTransferred(id, from, to);
    }

    function updateStatus(uint256 id, Status newStatus) external productExists(id) onlyOwner(id) {
        require(products[id].status != Status.SOLD, "Product already completed");
        require(uint8(newStatus) == uint8(products[id].status) + 1, "Invalid status transition");

        products[id].status = newStatus;

        history[id].push(HistoryEntry({
            actor: msg.sender,
            action: "Status Updated",
            timestamp: block.timestamp
        }));

        emit StatusUpdated(id, newStatus);
    }

    function verifyProduct(uint256 id) external view productExists(id) returns (bool exists, address currentOwner, Status status) {
        Product storage p = products[id];
        exists = true;
        currentOwner = p.currentOwner;
        status = p.status;
    }

    function getProduct(uint256 id) external view productExists(id) returns (Product memory) {
        return products[id];
    }

    function getHistory(uint256 id) external view productExists(id) returns (HistoryEntry[] memory) {
        return history[id];
    }

    function getTotalProducts() external view returns (uint256) {
        return productCounter;
    }

    function addCertificationHash(
        uint256 productId,
        string memory cid,
        string memory fileName
    ) external productExists(productId) onlyOwner(productId) {
        require(bytes(cid).length > 0, "SupplyChain: CID required");
        require(bytes(fileName).length > 0, "SupplyChain: File name required");

        certifications[productId].push(CertificationEntry({
            cid: cid,
            fileName: fileName,
            timestamp: block.timestamp,
            uploader: msg.sender
        }));

        history[productId].push(HistoryEntry({
            actor: msg.sender,
            action: "Certification Added",
            timestamp: block.timestamp
        }));

        emit CertificationAdded(productId, cid, msg.sender);
    }

    function getCertifications(uint256 id) external view productExists(id) returns (CertificationEntry[] memory) {
        return certifications[id];
    }

    function logSensorReading(
        uint256 productId,
        int256  temperature,
        uint256 humidity
    ) external productExists(productId) {
        require(roles[msg.sender] != Role.NONE, "SupplyChain: Unauthorized");
        require(humidity <= 100, "SupplyChain: Invalid humidity");

        sensorReadings[productId].push(SensorEntry({
            temperature: temperature,
            humidity:    humidity,
            timestamp:   block.timestamp,
            logger:      msg.sender
        }));

        emit SensorReading(productId, temperature, humidity, block.timestamp, msg.sender);
    }

    function getSensorReadings(uint256 id)
        external
        view
        productExists(id)
        returns (SensorEntry[] memory)
    {
        return sensorReadings[id];
    }

    function issueRecall(uint256 productId, string memory reason)
        external
        productExists(productId)
        onlyRole(Role.MANUFACTURER)
    {
        require(bytes(reason).length > 0, "SupplyChain: Reason required");
        require(!recalls[productId].active, "SupplyChain: Already recalled");

        recalls[productId] = RecallEntry({
            active:    true,
            reason:    reason,
            issuedBy:  msg.sender,
            timestamp: block.timestamp
        });

        history[productId].push(HistoryEntry({
            actor:     msg.sender,
            action:    "Product Recalled",
            timestamp: block.timestamp
        }));

        emit ProductRecalled(productId, reason, msg.sender);
    }

    function liftRecall(uint256 productId)
        external
        productExists(productId)
        onlyRole(Role.MANUFACTURER)
    {
        require(recalls[productId].active, "SupplyChain: Not recalled");

        recalls[productId].active = false;

        history[productId].push(HistoryEntry({
            actor:     msg.sender,
            action:    "Recall Lifted",
            timestamp: block.timestamp
        }));

        emit RecallLifted(productId, msg.sender);
    }

    function getRecall(uint256 id)
        external
        view
        productExists(id)
        returns (RecallEntry memory)
    {
        return recalls[id];
    }
}
