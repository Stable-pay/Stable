// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract SimpleStablePayWithdrawal {
    struct WithdrawalRequest {
        address user;
        address token;
        uint256 amount;
        string kycId;
        string bankAccount;
        bool processed;
        uint256 timestamp;
        bytes32 transactionId;
    }

    struct UserConsent {
        address user;
        address token;
        uint256 amount;
        uint256 timestamp;
        bool granted;
    }

    // State variables
    mapping(bytes32 => WithdrawalRequest) public withdrawalRequests;
    mapping(address => UserConsent) public userConsents;
    mapping(address => bool) public authorizedOperators;

    address public owner;
    address public custodyWallet;
    uint256 public withdrawalFee; // in basis points (e.g., 100 = 1%)
    uint256 public constant MAX_FEE = 500; // 5% maximum fee
    bool public paused = false;

    bytes32[] public allWithdrawalIds;

    // Events
    event WithdrawalRequested(
        bytes32 indexed transactionId,
        address indexed user,
        address indexed token,
        uint256 amount,
        string kycId,
        string bankAccount
    );

    event WithdrawalProcessed(
        bytes32 indexed transactionId,
        address indexed user,
        uint256 amountTransferred,
        uint256 feeDeducted
    );

    event ConsentGranted(
        address indexed user,
        address indexed token,
        uint256 amount
    );

    event CustodyWalletUpdated(address oldWallet, address newWallet);

    constructor(address _custodyWallet, uint256 _withdrawalFee) {
        require(_custodyWallet != address(0), "Invalid custody wallet");
        require(_withdrawalFee <= MAX_FEE, "Fee too high");

        owner = msg.sender;
        custodyWallet = _custodyWallet;
        withdrawalFee = _withdrawalFee;

        // Grant initial operator permissions to deployer
        authorizedOperators[msg.sender] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedOperators[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    modifier nonReentrant() {
        require(!_reentrancyGuard, "Reentrant call");
        _reentrancyGuard = true;
        _;
        _reentrancyGuard = false;
    }

    bool private _reentrancyGuard;

    // User consent mechanism
    function grantConsent(address token, uint256 amount) external whenNotPaused {
        require(amount > 0, "Invalid amount");

        userConsents[msg.sender] = UserConsent({
            user: msg.sender,
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            granted: true
        });

        emit ConsentGranted(msg.sender, token, amount);
    }

    // Revoke consent
    function revokeConsent() external {
        delete userConsents[msg.sender];
    }

    // Check if user has valid consent
    function hasValidConsent(address user, address token, uint256 amount) public view returns (bool) {
        UserConsent memory consent = userConsents[user];

        return consent.granted &&
               consent.token == token &&
               consent.amount >= amount &&
               block.timestamp <= consent.timestamp + 1 hours; // 1 hour validity
    }

    // Execute direct transfer to custody wallet
    function executeDirectTransfer(
        address token,
        uint256 amount,
        string calldata kycId,
        string calldata bankAccount
    ) external payable nonReentrant whenNotPaused returns (bytes32) {
        require(amount > 0, "Invalid amount");
        require(bytes(kycId).length > 0, "KYC ID required");
        require(bytes(bankAccount).length > 0, "Bank account required");
        require(custodyWallet != address(0), "Custody wallet not set");

        // Verify user consent
        require(hasValidConsent(msg.sender, token, amount), "Valid consent required");

        bytes32 transactionId = keccak256(
            abi.encodePacked(msg.sender, token, amount, block.timestamp, "direct")
        );

        // Calculate fee
        uint256 feeAmount = (amount * withdrawalFee) / 10000;
        uint256 transferAmount = amount - feeAmount;

        // Execute transfer immediately
        if (token == address(0)) {
            require(msg.value >= amount, "Insufficient ETH sent");

            // Transfer ETH to custody wallet
            (bool success1, ) = payable(custodyWallet).call{value: transferAmount}("");
            require(success1, "Transfer to custody failed");

            // Transfer fee to owner if applicable
            if (feeAmount > 0) {
                (bool success2, ) = payable(owner).call{value: feeAmount}("");
                require(success2, "Fee transfer failed");
            }
        } else {
            IERC20 tokenContract = IERC20(token);

            // Transfer from user to custody wallet
            require(
                tokenContract.transferFrom(msg.sender, custodyWallet, transferAmount),
                "Transfer to custody failed"
            );

            // Transfer fee to owner if applicable
            if (feeAmount > 0) {
                require(
                    tokenContract.transferFrom(msg.sender, owner, feeAmount),
                    "Fee transfer failed"
                );
            }
        }

        // Store record
        withdrawalRequests[transactionId] = WithdrawalRequest({
            user: msg.sender,
            token: token,
            amount: amount,
            kycId: kycId,
            bankAccount: bankAccount,
            processed: true,
            timestamp: block.timestamp,
            transactionId: transactionId
        });

        allWithdrawalIds.push(transactionId);

        // Clear consent
        delete userConsents[msg.sender];

        emit WithdrawalProcessed(transactionId, msg.sender, transferAmount, feeAmount);

        return transactionId;
    }

    // Request withdrawal (for two-step process)
    function requestWithdrawal(
        address token,
        uint256 amount,
        string calldata kycId,
        string calldata bankAccount
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(amount > 0, "Invalid amount");
        require(bytes(kycId).length > 0, "KYC ID required");
        require(bytes(bankAccount).length > 0, "Bank account required");

        // Verify user consent
        require(hasValidConsent(msg.sender, token, amount), "Valid consent required");

        // Check user balance
        if (token != address(0)) {
            require(IERC20(token).balanceOf(msg.sender) >= amount, "Insufficient balance");
        } else {
            require(msg.sender.balance >= amount, "Insufficient ETH balance");
        }

        // Generate unique transaction ID
        bytes32 transactionId = keccak256(
            abi.encodePacked(msg.sender, token, amount, block.timestamp, block.number)
        );

        // Store withdrawal request
        withdrawalRequests[transactionId] = WithdrawalRequest({
            user: msg.sender,
            token: token,
            amount: amount,
            kycId: kycId,
            bankAccount: bankAccount,
            processed: false,
            timestamp: block.timestamp,
            transactionId: transactionId
        });

        allWithdrawalIds.push(transactionId);

        emit WithdrawalRequested(transactionId, msg.sender, token, amount, kycId, bankAccount);

        return transactionId;
    }

    // Administrative functions
    function setCustodyWallet(address _custodyWallet) external onlyOwner {
        require(_custodyWallet != address(0), "Invalid wallet");
        address oldWallet = custodyWallet;
        custodyWallet = _custodyWallet;
        emit CustodyWalletUpdated(oldWallet, _custodyWallet);
    }

    function setWithdrawalFee(uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE, "Fee too high");
        withdrawalFee = _fee;
    }

    function authorizeOperator(address operator) external onlyOwner {
        require(operator != address(0), "Invalid operator");
        authorizedOperators[operator] = true;
    }

    function revokeOperator(address operator) external onlyOwner {
        authorizedOperators[operator] = false;
    }

    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }

    // View functions
    function getWithdrawalRequest(bytes32 transactionId) external view returns (WithdrawalRequest memory) {
        return withdrawalRequests[transactionId];
    }

    function getAllWithdrawals() external view returns (bytes32[] memory) {
        return allWithdrawalIds;
    }

    function getUserConsent(address user) external view returns (UserConsent memory) {
        return userConsents[user];
    }

    // Emergency functions
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = payable(owner).call{value: amount}("");
            require(success, "Emergency withdraw failed");
        } else {
            require(IERC20(token).transfer(owner, amount), "Emergency withdraw failed");
        }
    }

    // Allow contract to receive ETH
    receive() external payable {}
    fallback() external payable {}
}