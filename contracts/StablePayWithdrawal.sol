// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title StablePayWithdrawal
 * @dev Smart contract for secure token transfers with user consent for INR withdrawals
 * @notice This contract handles token transfers from users to admin wallets with proper consent and logging
 */
contract StablePayWithdrawal {
    
    // Events
    event WithdrawalInitiated(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 indexed withdrawalId,
        string inrAmount,
        string bankAccount
    );

    event WithdrawalCompleted(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 indexed withdrawalId,
        address adminWallet
    );

    event WithdrawalCancelled(
        address indexed user,
        uint256 indexed withdrawalId,
        string reason
    );

    event AdminWalletUpdated(
        uint256 indexed chainId,
        address oldWallet,
        address newWallet
    );

    // Structs
    struct WithdrawalRequest {
        address user;
        address token;
        uint256 amount;
        string inrAmount;
        string bankAccount;
        uint256 timestamp;
        bool completed;
        bool cancelled;
        address adminWallet;
    }

    // State variables
    address public owner;
    mapping(uint256 => address) public adminWallets; // chainId => admin wallet
    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    mapping(address => uint256[]) public userWithdrawals;
    mapping(address => bool) public authorizedOperators;
    
    uint256 public nextWithdrawalId = 1;
    uint256 public withdrawalTimeout = 24 hours;
    uint256 public minimumTransferAmount = 1000;
    
    // Fee configuration
    uint256 public serviceFeePercentage = 50; // 0.5% (50/10000)
    uint256 public constant MAX_FEE_PERCENTAGE = 500; // 5% maximum
    address public feeCollector;
    
    bool public paused = false;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedOperators[msg.sender], "Not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    modifier validWithdrawal(uint256 withdrawalId) {
        require(withdrawalId < nextWithdrawalId, "Invalid withdrawal ID");
        require(!withdrawalRequests[withdrawalId].completed, "Withdrawal already completed");
        require(!withdrawalRequests[withdrawalId].cancelled, "Withdrawal cancelled");
        _;
    }

    modifier onlyWithdrawalUser(uint256 withdrawalId) {
        require(withdrawalRequests[withdrawalId].user == msg.sender, "Not withdrawal owner");
        _;
    }

    constructor(address _feeCollector) {
        require(_feeCollector != address(0), "Invalid fee collector");
        owner = msg.sender;
        feeCollector = _feeCollector;
    }

    /**
     * @dev Initiate a withdrawal request with user consent
     * @param token Address of the token to withdraw (use address(0) for native ETH)
     * @param amount Amount of tokens to withdraw
     * @param inrAmount Expected INR amount as string
     * @param bankAccount Bank account details (masked)
     */
    function initiateWithdrawal(
        address token,
        uint256 amount,
        string calldata inrAmount,
        string calldata bankAccount
    ) external payable whenNotPaused returns (uint256 withdrawalId) {
        require(amount >= minimumTransferAmount, "Amount below minimum");
        require(bytes(inrAmount).length > 0, "INR amount required");
        require(bytes(bankAccount).length > 0, "Bank account required");

        uint256 chainId = block.chainid;
        address adminWallet = adminWallets[chainId];
        require(adminWallet != address(0), "Admin wallet not configured for this chain");

        // Handle native token (ETH, MATIC, BNB, etc.)
        if (token == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "ETH not needed for ERC20");
            // Check user's token balance and allowance
            IERC20 tokenContract = IERC20(token);
            require(tokenContract.balanceOf(msg.sender) >= amount, "Insufficient token balance");
            require(tokenContract.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
        }

        withdrawalId = nextWithdrawalId++;

        withdrawalRequests[withdrawalId] = WithdrawalRequest({
            user: msg.sender,
            token: token,
            amount: amount,
            inrAmount: inrAmount,
            bankAccount: bankAccount,
            timestamp: block.timestamp,
            completed: false,
            cancelled: false,
            adminWallet: adminWallet
        });

        userWithdrawals[msg.sender].push(withdrawalId);

        emit WithdrawalInitiated(msg.sender, token, amount, withdrawalId, inrAmount, bankAccount);

        return withdrawalId;
    }

    /**
     * @dev Complete the withdrawal by transferring tokens to admin wallet
     * @param withdrawalId The withdrawal request ID
     */
    function completeWithdrawal(uint256 withdrawalId) 
        external 
        validWithdrawal(withdrawalId)
        onlyWithdrawalUser(withdrawalId)
        whenNotPaused
    {
        WithdrawalRequest storage request = withdrawalRequests[withdrawalId];
        
        // Check timeout
        require(block.timestamp <= request.timestamp + withdrawalTimeout, "Withdrawal expired");

        // Calculate service fee
        uint256 fee = (request.amount * serviceFeePercentage) / 10000;
        uint256 transferAmount = request.amount - fee;

        // Execute transfer
        if (request.token == address(0)) {
            // Transfer native token
            if (fee > 0) {
                payable(feeCollector).transfer(fee);
            }
            payable(request.adminWallet).transfer(transferAmount);
        } else {
            // Transfer ERC20 token
            IERC20 tokenContract = IERC20(request.token);
            
            // Transfer tokens from user to contract first
            require(
                tokenContract.transferFrom(request.user, address(this), request.amount),
                "Token transfer failed"
            );
            
            if (fee > 0) {
                require(
                    tokenContract.transfer(feeCollector, fee),
                    "Fee transfer failed"
                );
            }
            require(
                tokenContract.transfer(request.adminWallet, transferAmount),
                "Admin transfer failed"
            );
        }

        request.completed = true;

        emit WithdrawalCompleted(
            request.user,
            request.token,
            request.amount,
            withdrawalId,
            request.adminWallet
        );
    }

    /**
     * @dev Cancel a withdrawal request (only by user or owner)
     * @param withdrawalId The withdrawal request ID
     * @param reason Reason for cancellation
     */
    function cancelWithdrawal(uint256 withdrawalId, string calldata reason) 
        external 
        validWithdrawal(withdrawalId)
    {
        WithdrawalRequest storage request = withdrawalRequests[withdrawalId];
        
        require(
            msg.sender == request.user || msg.sender == owner,
            "Not authorized to cancel"
        );

        request.cancelled = true;

        emit WithdrawalCancelled(request.user, withdrawalId, reason);
    }

    /**
     * @dev Set admin wallet for a specific chain
     * @param chainId The blockchain chain ID
     * @param adminWallet The admin wallet address
     */
    function setAdminWallet(uint256 chainId, address adminWallet) external onlyOwner {
        require(adminWallet != address(0), "Invalid admin wallet");
        
        address oldWallet = adminWallets[chainId];
        adminWallets[chainId] = adminWallet;

        emit AdminWalletUpdated(chainId, oldWallet, adminWallet);
    }

    /**
     * @dev Add or remove authorized operator
     * @param operator Operator address
     * @param authorized Authorization status
     */
    function setAuthorizedOperator(address operator, bool authorized) external onlyOwner {
        authorizedOperators[operator] = authorized;
    }

    /**
     * @dev Update withdrawal timeout
     * @param newTimeout New timeout in seconds
     */
    function setWithdrawalTimeout(uint256 newTimeout) external onlyOwner {
        require(newTimeout >= 1 hours && newTimeout <= 7 days, "Invalid timeout");
        withdrawalTimeout = newTimeout;
    }

    /**
     * @dev Update minimum transfer amount
     * @param newMinimum New minimum amount in wei
     */
    function setMinimumTransferAmount(uint256 newMinimum) external onlyOwner {
        minimumTransferAmount = newMinimum;
    }

    /**
     * @dev Update service fee percentage
     * @param newFeePercentage New fee percentage (in basis points, e.g., 50 = 0.5%)
     */
    function setServiceFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= MAX_FEE_PERCENTAGE, "Fee too high");
        serviceFeePercentage = newFeePercentage;
    }

    /**
     * @dev Update fee collector address
     * @param newFeeCollector New fee collector address
     */
    function setFeeCollector(address newFeeCollector) external onlyOwner {
        require(newFeeCollector != address(0), "Invalid fee collector");
        feeCollector = newFeeCollector;
    }

    /**
     * @dev Emergency withdraw function for stuck tokens
     * @param token Token address (address(0) for native token)
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");

        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient balance");
            payable(to).transfer(amount);
        } else {
            IERC20(token).transfer(to, amount);
        }
    }

    /**
     * @dev Get withdrawal request details
     * @param withdrawalId The withdrawal request ID
     */
    function getWithdrawalRequest(uint256 withdrawalId) 
        external 
        view 
        returns (WithdrawalRequest memory) 
    {
        return withdrawalRequests[withdrawalId];
    }

    /**
     * @dev Get user's withdrawal history
     * @param user User address
     */
    function getUserWithdrawals(address user) external view returns (uint256[] memory) {
        return userWithdrawals[user];
    }

    /**
     * @dev Check if withdrawal is expired
     * @param withdrawalId The withdrawal request ID
     */
    function isWithdrawalExpired(uint256 withdrawalId) external view returns (bool) {
        if (withdrawalId >= nextWithdrawalId) return false;
        
        WithdrawalRequest memory request = withdrawalRequests[withdrawalId];
        return block.timestamp > request.timestamp + withdrawalTimeout;
    }

    /**
     * @dev Calculate fees for a given amount
     * @param amount The amount to calculate fees for
     */
    function calculateFees(uint256 amount) external view returns (uint256 fee, uint256 netAmount) {
        fee = (amount * serviceFeePercentage) / 10000;
        netAmount = amount - fee;
    }

    /**
     * @dev Pause contract operations
     */
    function pause() external onlyOwner {
        paused = true;
    }

    /**
     * @dev Unpause contract operations
     */
    function unpause() external onlyOwner {
        paused = false;
    }

    /**
     * @dev Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }

    /**
     * @dev Allow contract to receive native tokens
     */
    receive() external payable {}
}