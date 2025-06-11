// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AutoConsentStablePayWithdrawal is ReentrancyGuard, Pausable {
    address public owner;
    address public custodyWallet;
    uint256 public withdrawalFee; // Fee in basis points (100 = 1%)
    uint256 public constant MAX_FEE = 500; // Maximum 5% fee
    
    mapping(address => bool) public authorizedOperators;
    mapping(address => UserConsent) public userConsents;
    mapping(bytes32 => WithdrawalRequest) public withdrawalRequests;
    mapping(address => bool) public autoConsentEnabled; // Auto consent per user
    
    struct UserConsent {
        address user;
        address token;
        uint256 amount;
        uint256 timestamp;
        bool granted;
        bool autoConsent; // Flag for automatic consent
    }
    
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
        uint256 amount,
        bool autoConsent
    );
    
    event AutoConsentEnabled(address indexed user);
    event AutoConsentDisabled(address indexed user);
    
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

    modifier whenNotPausedOrOwner() {
        require(!paused() || msg.sender == owner, "Contract paused");
        _;
    }

    // Enable auto-consent for user
    function enableAutoConsent() external {
        autoConsentEnabled[msg.sender] = true;
        emit AutoConsentEnabled(msg.sender);
    }

    // Disable auto-consent for user
    function disableAutoConsent() external {
        autoConsentEnabled[msg.sender] = false;
        emit AutoConsentDisabled(msg.sender);
    }

    // Grant consent (manual or automatic)
    function grantConsent(address token, uint256 amount) external {
        userConsents[msg.sender] = UserConsent({
            user: msg.sender,
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            granted: true,
            autoConsent: autoConsentEnabled[msg.sender]
        });
        
        emit ConsentGranted(msg.sender, token, amount, autoConsentEnabled[msg.sender]);
    }

    // Auto-grant consent during withdrawal (if enabled)
    function _autoGrantConsent(address user, address token, uint256 amount) internal {
        if (autoConsentEnabled[user]) {
            userConsents[user] = UserConsent({
                user: user,
                token: token,
                amount: amount,
                timestamp: block.timestamp,
                granted: true,
                autoConsent: true
            });
            
            emit ConsentGranted(user, token, amount, true);
        }
    }

    // Revoke consent
    function revokeConsent() external {
        delete userConsents[msg.sender];
    }

    // Check if user has valid consent
    function hasValidConsent(address user, address token, uint256 amount) public view returns (bool) {
        UserConsent memory consent = userConsents[user];
        
        // Auto-consent users don't need pre-existing consent
        if (autoConsentEnabled[user]) {
            return true;
        }
        
        return consent.granted &&
               consent.token == token &&
               consent.amount >= amount &&
               block.timestamp <= consent.timestamp + 1 hours; // 1 hour validity
    }

    // Instant withdrawal with auto-consent
    function withdrawWithAutoConsent(
        address token,
        uint256 amount,
        string calldata kycId,
        string calldata bankAccount
    ) external payable nonReentrant whenNotPausedOrOwner returns (bytes32) {
        require(amount > 0, "Invalid amount");
        require(bytes(kycId).length > 0, "KYC ID required");
        
        // Auto-grant consent if enabled
        _autoGrantConsent(msg.sender, token, amount);
        
        // Verify consent (now guaranteed for auto-consent users)
        require(hasValidConsent(msg.sender, token, amount), "Valid consent required");

        bytes32 transactionId = keccak256(
            abi.encodePacked(msg.sender, token, amount, block.timestamp, "auto-withdraw")
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

        // Record withdrawal
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

        emit WithdrawalRequested(transactionId, msg.sender, token, amount, kycId, bankAccount);
        emit WithdrawalProcessed(transactionId, msg.sender, transferAmount, feeAmount);

        return transactionId;
    }

    // Legacy direct transfer method (for backwards compatibility)
    function executeDirectTransfer(
        address token,
        uint256 amount,
        string calldata kycId,
        string calldata bankAccount
    ) external payable nonReentrant whenNotPausedOrOwner returns (bytes32) {
        return withdrawWithAutoConsent(token, amount, kycId, bankAccount);
    }

    // Get withdrawal request details
    function getWithdrawalRequest(bytes32 transactionId) external view returns (WithdrawalRequest memory) {
        return withdrawalRequests[transactionId];
    }

    // Get user consent details
    function getUserConsent(address user) external view returns (UserConsent memory) {
        return userConsents[user];
    }

    // Check if auto-consent is enabled for user
    function isAutoConsentEnabled(address user) external view returns (bool) {
        return autoConsentEnabled[user];
    }

    // Owner functions
    function setOperator(address operator, bool authorized) external onlyOwner {
        authorizedOperators[operator] = authorized;
    }

    function setCustodyWallet(address newCustodyWallet) external onlyOwner {
        require(newCustodyWallet != address(0), "Invalid wallet address");
        address oldWallet = custodyWallet;
        custodyWallet = newCustodyWallet;
        emit CustodyWalletUpdated(oldWallet, newCustodyWallet);
    }

    function setWithdrawalFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        withdrawalFee = newFee;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function emergencyWithdrawToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner, amount);
    }

    // Receive function for direct ETH transfers
    receive() external payable {}
}