// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StablePayWithdrawal is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

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
    
    address public custodyWallet;
    uint256 public withdrawalFee; // in basis points (e.g., 100 = 1%)
    uint256 public constant MAX_FEE = 500; // 5% maximum fee
    
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
    event OperatorAuthorized(address indexed operator);
    event OperatorRevoked(address indexed operator);

    constructor(
        address _custodyWallet,
        uint256 _withdrawalFee
    ) {
        require(_custodyWallet != address(0), "Invalid custody wallet");
        require(_withdrawalFee <= MAX_FEE, "Fee too high");
        
        custodyWallet = _custodyWallet;
        withdrawalFee = _withdrawalFee;
        
        // Grant initial operator permissions to deployer
        authorizedOperators[msg.sender] = true;
    }

    modifier onlyAuthorized() {
        require(
            authorizedOperators[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    // User consent mechanism
    function grantConsent(
        address token,
        uint256 amount
    ) external whenNotPaused {
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
    function hasValidConsent(
        address user,
        address token,
        uint256 amount
    ) public view returns (bool) {
        UserConsent memory consent = userConsents[user];
        
        return consent.granted &&
               consent.token == token &&
               consent.amount >= amount &&
               block.timestamp <= consent.timestamp + 1 hours; // 1 hour validity
    }

    // Request withdrawal with user consent verification
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
        require(
            hasValidConsent(msg.sender, token, amount),
            "Valid consent required"
        );

        // Check user balance
        uint256 userBalance;
        if (token == address(0)) {
            userBalance = msg.sender.balance;
        } else {
            userBalance = IERC20(token).balanceOf(msg.sender);
        }
        require(userBalance >= amount, "Insufficient balance");

        // Generate unique transaction ID
        bytes32 transactionId = keccak256(
            abi.encodePacked(
                msg.sender,
                token,
                amount,
                block.timestamp,
                block.number
            )
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

        emit WithdrawalRequested(
            transactionId,
            msg.sender,
            token,
            amount,
            kycId,
            bankAccount
        );

        return transactionId;
    }

    // Process withdrawal by authorized operator
    function processWithdrawal(
        bytes32 transactionId
    ) external onlyAuthorized nonReentrant whenNotPaused {
        WithdrawalRequest storage request = withdrawalRequests[transactionId];
        require(request.user != address(0), "Request not found");
        require(!request.processed, "Already processed");

        // Calculate fee
        uint256 feeAmount = (request.amount * withdrawalFee) / 10000;
        uint256 transferAmount = request.amount - feeAmount;

        // Transfer tokens to custody wallet
        if (request.token == address(0)) {
            // Native token transfer
            require(request.user.balance >= request.amount, "Insufficient ETH balance");
            
            // This requires user to send ETH to contract first
            require(address(this).balance >= request.amount, "Contract insufficient balance");
            
            payable(custodyWallet).transfer(transferAmount);
            if (feeAmount > 0) {
                payable(owner()).transfer(feeAmount);
            }
        } else {
            // ERC20 token transfer
            IERC20 tokenContract = IERC20(request.token);
            require(
                tokenContract.balanceOf(request.user) >= request.amount,
                "Insufficient token balance"
            );

            // Transfer from user to custody wallet
            tokenContract.safeTransferFrom(
                request.user,
                custodyWallet,
                transferAmount
            );

            // Transfer fee to owner if applicable
            if (feeAmount > 0) {
                tokenContract.safeTransferFrom(
                    request.user,
                    owner(),
                    feeAmount
                );
            }
        }

        // Mark as processed
        request.processed = true;

        // Clear user consent after successful processing
        delete userConsents[request.user];

        emit WithdrawalProcessed(
            transactionId,
            request.user,
            transferAmount,
            feeAmount
        );
    }

    // Direct token transfer method for immediate processing
    function executeDirectTransfer(
        address token,
        uint256 amount,
        string calldata kycId,
        string calldata bankAccount
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(amount > 0, "Invalid amount");
        require(bytes(kycId).length > 0, "KYC ID required");
        
        // Verify user consent
        require(
            hasValidConsent(msg.sender, token, amount),
            "Valid consent required"
        );

        bytes32 transactionId = keccak256(
            abi.encodePacked(
                msg.sender,
                token,
                amount,
                block.timestamp,
                "direct"
            )
        );

        // Calculate fee
        uint256 feeAmount = (amount * withdrawalFee) / 10000;
        uint256 transferAmount = amount - feeAmount;

        // Execute transfer immediately
        if (token == address(0)) {
            require(msg.sender.balance >= amount, "Insufficient ETH balance");
            require(address(this).balance >= amount, "Contract insufficient balance");
            
            payable(custodyWallet).transfer(transferAmount);
            if (feeAmount > 0) {
                payable(owner()).transfer(feeAmount);
            }
        } else {
            IERC20 tokenContract = IERC20(token);
            
            // Transfer from user to custody wallet
            tokenContract.safeTransferFrom(
                msg.sender,
                custodyWallet,
                transferAmount
            );

            if (feeAmount > 0) {
                tokenContract.safeTransferFrom(
                    msg.sender,
                    owner(),
                    feeAmount
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

        emit WithdrawalProcessed(
            transactionId,
            msg.sender,
            transferAmount,
            feeAmount
        );

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
        emit OperatorAuthorized(operator);
    }

    function revokeOperator(address operator) external onlyOwner {
        authorizedOperators[operator] = false;
        emit OperatorRevoked(operator);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions
    function getWithdrawalRequest(bytes32 transactionId)
        external
        view
        returns (WithdrawalRequest memory)
    {
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
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    // Allow contract to receive ETH
    receive() external payable {}
    fallback() external payable {}
}