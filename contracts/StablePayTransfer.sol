// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract StablePayTransfer {
    mapping(address => bool) public authorizedCallers;
    mapping(uint256 => address) public adminWallets;
    
    event TokenTransfer(
        address indexed from,
        address indexed token,
        uint256 amount,
        address indexed adminWallet,
        uint256 chainId
    );
    
    event AdminWalletUpdated(uint256 indexed chainId, address indexed newAdmin);
    
    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender], "Not authorized");
        _;
    }
    
    constructor(address _custodyWallet) {
        authorizedCallers[msg.sender] = true;
        authorizedCallers[_custodyWallet] = true;
        
        // Set default admin wallets for each chain
        adminWallets[1] = 0x0f9947c3e98c59975a033843d90cc1ecc17f06f3; // Ethereum
        adminWallets[56] = 0x0f9947c3e98c59975a033843d90cc1ecc17f06f3; // BSC
        adminWallets[137] = 0x0f9947c3e98c59975a033843d90cc1ecc17f06f3; // Polygon
        adminWallets[42161] = 0x0f9947c3e98c59975a033843d90cc1ecc17f06f3; // Arbitrum
        adminWallets[10] = 0x0f9947c3e98c59975a033843d90cc1ecc17f06f3; // Optimism
        adminWallets[43114] = 0x0f9947c3e98c59975a033843d90cc1ecc17f06f3; // Avalanche
        adminWallets[1337] = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Local hardhat
    }
    
    function transferToAdmin(address token, uint256 amount) external payable {
        uint256 chainId = block.chainid;
        address adminWallet = adminWallets[chainId];
        require(adminWallet != address(0), "Admin wallet not configured for this chain");
        
        if (token == address(0)) {
            // Native token transfer (ETH, BNB, MATIC, etc.)
            require(msg.value >= amount, "Insufficient ETH sent");
            
            (bool success, ) = adminWallet.call{value: amount}("");
            require(success, "Native token transfer failed");
            
            // Refund excess ETH
            if (msg.value > amount) {
                (bool refundSuccess, ) = msg.sender.call{value: msg.value - amount}("");
                require(refundSuccess, "Refund failed");
            }
        } else {
            // ERC20 token transfer
            IERC20 tokenContract = IERC20(token);
            require(tokenContract.transferFrom(msg.sender, adminWallet, amount), "ERC20 transfer failed");
        }
        
        emit TokenTransfer(msg.sender, token, amount, adminWallet, chainId);
    }
    
    function directTransfer(address token, uint256 amount, address recipient) external {
        require(recipient != address(0), "Invalid recipient");
        
        if (token == address(0)) {
            // Native token transfer
            require(msg.value >= amount, "Insufficient ETH sent");
            
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "Native token transfer failed");
            
            // Refund excess
            if (msg.value > amount) {
                (bool refundSuccess, ) = msg.sender.call{value: msg.value - amount}("");
                require(refundSuccess, "Refund failed");
            }
        } else {
            // ERC20 token transfer
            IERC20 tokenContract = IERC20(token);
            require(tokenContract.transferFrom(msg.sender, recipient, amount), "ERC20 transfer failed");
        }
        
        emit TokenTransfer(msg.sender, token, amount, recipient, block.chainid);
    }
    
    function setAdminWallet(uint256 chainId, address newAdmin) external onlyAuthorized {
        require(newAdmin != address(0), "Invalid admin address");
        adminWallets[chainId] = newAdmin;
        emit AdminWalletUpdated(chainId, newAdmin);
    }
    
    function addAuthorizedCaller(address caller) external onlyAuthorized {
        authorizedCallers[caller] = true;
    }
    
    function removeAuthorizedCaller(address caller) external onlyAuthorized {
        authorizedCallers[caller] = false;
    }
    
    function getAdminWallet(uint256 chainId) external view returns (address) {
        return adminWallets[chainId];
    }
    
    function getCurrentChainAdmin() external view returns (address) {
        return adminWallets[block.chainid];
    }
    
    // Emergency withdrawal function
    function emergencyWithdraw(address token, uint256 amount) external onlyAuthorized {
        if (token == address(0)) {
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "Emergency withdrawal failed");
        } else {
            IERC20 tokenContract = IERC20(token);
            require(tokenContract.transfer(msg.sender, amount), "Emergency token withdrawal failed");
        }
    }
    
    receive() external payable {}
}