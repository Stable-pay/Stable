// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenWithdrawalContract is ReentrancyGuard, Ownable {
    struct WithdrawalRequest {
        address user;
        address token;
        uint256 tokenAmount;
        uint256 inrAmount;
        uint256 exchangeRate; // Rate in wei (1 token = exchangeRate INR * 1e18)
        bool completed;
        uint256 timestamp;
        string transactionId;
    }

    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    mapping(address => bool) public allowedTokens;
    mapping(address => uint256) public tokenToInrRate; // Exchange rates in wei
    
    uint256 public nextRequestId = 1;
    address public adminWallet;
    
    event WithdrawalRequested(
        uint256 indexed requestId,
        address indexed user,
        address indexed token,
        uint256 tokenAmount,
        uint256 inrAmount,
        uint256 exchangeRate
    );
    
    event WithdrawalCompleted(
        uint256 indexed requestId,
        string transactionId
    );
    
    event TokenAllowed(address indexed token, bool allowed);
    event ExchangeRateUpdated(address indexed token, uint256 newRate);

    constructor() {
        adminWallet = msg.sender;
        
        // Initialize common tokens as allowed
        // These addresses should be updated for each network
        allowedTokens[0xA0b86a33E6E3B0c8c8D7D45b40b9b5Ba0b3D0e8B] = true; // USDC
        allowedTokens[0xdAC17F958D2ee523a2206206994597C13D831ec7] = true; // USDT
        allowedTokens[0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE] = true; // ETH
        
        // Set initial exchange rates (will be updated by oracle)
        tokenToInrRate[0xA0b86a33E6E3B0c8c8D7D45b40b9b5Ba0b3D0e8B] = 84 * 1e18; // USDC to INR
        tokenToInrRate[0xdAC17F958D2ee523a2206206994597C13D831ec7] = 84 * 1e18; // USDT to INR
        tokenToInrRate[0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE] = 250000 * 1e18; // ETH to INR
    }

    function setAdminWallet(address _adminWallet) external onlyOwner {
        adminWallet = _adminWallet;
    }

    function setTokenAllowed(address token, bool allowed) external onlyOwner {
        allowedTokens[token] = allowed;
        emit TokenAllowed(token, allowed);
    }

    function updateExchangeRate(address token, uint256 newRate) external onlyOwner {
        tokenToInrRate[token] = newRate;
        emit ExchangeRateUpdated(token, newRate);
    }

    function calculateInrAmount(address token, uint256 tokenAmount) public view returns (uint256) {
        require(allowedTokens[token], "Token not allowed");
        uint256 rate = tokenToInrRate[token];
        require(rate > 0, "Exchange rate not set");
        
        if (token == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) {
            // ETH has 18 decimals
            return (tokenAmount * rate) / 1e18;
        } else {
            // USDC/USDT have 6 decimals
            return (tokenAmount * rate) / 1e6;
        }
    }

    function requestWithdrawal(
        address token,
        uint256 tokenAmount,
        uint256 expectedInrAmount
    ) external payable nonReentrant {
        require(allowedTokens[token], "Token not allowed for withdrawal");
        require(tokenAmount > 0, "Amount must be greater than 0");
        
        uint256 calculatedInrAmount = calculateInrAmount(token, tokenAmount);
        require(
            calculatedInrAmount >= expectedInrAmount * 95 / 100, // 5% slippage tolerance
            "Exchange rate changed significantly"
        );

        if (token == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) {
            // ETH withdrawal
            require(msg.value == tokenAmount, "Incorrect ETH amount sent");
            
            // Transfer ETH to admin wallet
            (bool success, ) = adminWallet.call{value: tokenAmount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 token withdrawal
            IERC20 tokenContract = IERC20(token);
            require(
                tokenContract.transferFrom(msg.sender, adminWallet, tokenAmount),
                "Token transfer failed"
            );
        }

        uint256 requestId = nextRequestId++;
        withdrawalRequests[requestId] = WithdrawalRequest({
            user: msg.sender,
            token: token,
            tokenAmount: tokenAmount,
            inrAmount: calculatedInrAmount,
            exchangeRate: tokenToInrRate[token],
            completed: false,
            timestamp: block.timestamp,
            transactionId: ""
        });

        emit WithdrawalRequested(
            requestId,
            msg.sender,
            token,
            tokenAmount,
            calculatedInrAmount,
            tokenToInrRate[token]
        );
    }

    function completeWithdrawal(uint256 requestId, string calldata transactionId) external onlyOwner {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        require(request.user != address(0), "Invalid request ID");
        require(!request.completed, "Withdrawal already completed");

        request.completed = true;
        request.transactionId = transactionId;

        emit WithdrawalCompleted(requestId, transactionId);
    }

    function getWithdrawalRequest(uint256 requestId) external view returns (WithdrawalRequest memory) {
        return withdrawalRequests[requestId];
    }

    function getUserWithdrawals(address user) external view returns (WithdrawalRequest[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextRequestId; i++) {
            if (withdrawalRequests[i].user == user) {
                count++;
            }
        }

        WithdrawalRequest[] memory userRequests = new WithdrawalRequest[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextRequestId; i++) {
            if (withdrawalRequests[i].user == user) {
                userRequests[index] = withdrawalRequests[i];
                index++;
            }
        }

        return userRequests;
    }

    // Emergency functions
    function emergencyWithdrawToken(address token, uint256 amount) external onlyOwner {
        if (token == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) {
            (bool success, ) = owner().call{value: amount}("");
            require(success, "ETH withdrawal failed");
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }

    function getContractBalance(address token) external view returns (uint256) {
        if (token == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) {
            return address(this).balance;
        } else {
            return IERC20(token).balanceOf(address(this));
        }
    }

    receive() external payable {}
}