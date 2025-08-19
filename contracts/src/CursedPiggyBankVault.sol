// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * Cursed PiggyBank Vault
 * - Per-avatar vault keyed to Cursed Faction `CursedAvatar721` tokenIds
 * - Anyone can deposit; only current avatar owner can withdraw
 * - Balances follow the avatar on transfer (ownership checked against external ERC721)
 */

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract CursedPiggyBankVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC721 public immutable cursedAvatar;
    address public immutable creator; // contract creator/controller
    address public aiExecutor; // optional AI agent with creator privileges
    bool public treeRecordingEnabled = true;

    // ETH balances by avatar tokenId
    mapping(uint256 => uint256) public ethBalance;

    // ERC20 balances by tokenId => token => amount
    mapping(uint256 => mapping(address => uint256)) public erc20Balance;

    // Optional savings goal and unlock (unix timestamp)
    mapping(uint256 => uint256) public savingsGoal;
    mapping(uint256 => uint256) public unlockTime;

    // Per-avatar spend approvals for in-game payments
    mapping(uint256 => mapping(address => uint256)) public ethAllowance; // tokenId => spender => amount
    mapping(uint256 => mapping(address => mapping(address => uint256))) public erc20Allowance; // tokenId => token => spender => amount

    // --------- Payment Tree (lightweight on-chain, rich off-chain via events) ---------
    enum EdgeType {
        DepositETH,
        DepositERC20,
        WithdrawETH,
        WithdrawERC20,
        SpendETH,
        SpendERC20,
        ApproveETH,
        ApproveERC20,
        GoalSet,
        LockSet,
        Custom
    }

    struct Node {
        uint256 parentId;
        uint8 edgeType;
        address token; // address(0) for ETH
        address actor; // msg.sender who initiated
        uint256 amount; // value or approved amount
        uint64 timestamp;
        bytes32 meta; // optional off-chain pointer (IPFS hash, etc.)
    }

    // Per-tokenId node storage (minimal); use events for full analytics
    mapping(uint256 => uint256) public nodeCount; // last node id used
    mapping(uint256 => mapping(uint256 => Node)) public nodes; // tokenId => nodeId => Node
    mapping(uint256 => uint256) public lastNodeId; // tokenId => last node id for easy chaining

    event DepositedETH(uint256 indexed tokenId, address indexed from, uint256 amount);
    event WithdrawnETH(uint256 indexed tokenId, address indexed to, uint256 amount);
    event DepositedERC20(uint256 indexed tokenId, address indexed token, address indexed from, uint256 amount);
    event WithdrawnERC20(uint256 indexed tokenId, address indexed token, address indexed to, uint256 amount);
    event GoalSet(uint256 indexed tokenId, uint256 goalWei);
    event UnlockSet(uint256 indexed tokenId, uint256 unlockTime);
    event ApprovedETHSpender(uint256 indexed tokenId, address indexed spender, uint256 amount);
    event ApprovedERC20Spender(uint256 indexed tokenId, address indexed token, address indexed spender, uint256 amount);
    event SpentETH(uint256 indexed tokenId, address indexed to, uint256 amount, address indexed by);
    event SpentERC20(uint256 indexed tokenId, address indexed token, address indexed to, uint256 amount, address by);
    event NodeAppended(uint256 indexed tokenId, uint256 indexed nodeId, uint256 indexed parentId, uint8 edgeType, address token, address actor, uint256 amount, bytes32 meta);
    event NodeAnnotated(uint256 indexed tokenId, uint256 indexed nodeId, bytes32 meta);
    event AIExecutorSet(address indexed oldExecutor, address indexed newExecutor);
    event TreeRecordingToggled(bool enabled);

    constructor(address cursedAvatar721) {
        require(cursedAvatar721 != address(0), "avatar addr zero");
        cursedAvatar = IERC721(cursedAvatar721);
        creator = msg.sender;
    }

    // --------- Internal helpers ---------
    function _requireTokenExists(uint256 tokenId) internal view {
        // ownerOf MUST revert if token doesn't exist; emulate existence check
        // This view call will revert for non-existent tokenIds
        require(address(cursedAvatar) != address(0), "avatar not set");
        // We cannot try/catch in view, but revert message below is fine
        cursedAvatar.ownerOf(tokenId);
    }

    function _requireOwner(uint256 tokenId) internal view {
        require(cursedAvatar.ownerOf(tokenId) == msg.sender, "not owner");
    }

    modifier onlyCreator() {
        require(msg.sender == creator || msg.sender == aiExecutor, "not creator");
        _;
    }

    function _appendNode(
        uint256 tokenId,
        uint256 parentId,
        EdgeType edgeType,
        address token,
        address actor,
        uint256 amount,
        bytes32 meta
    ) internal {
        if (!treeRecordingEnabled) return;
        uint256 newId = ++nodeCount[tokenId];
        nodes[tokenId][newId] = Node({
            parentId: parentId,
            edgeType: uint8(edgeType),
            token: token,
            actor: actor,
            amount: amount,
            timestamp: uint64(block.timestamp),
            meta: meta
        });
        lastNodeId[tokenId] = newId;
        emit NodeAppended(tokenId, newId, parentId, uint8(edgeType), token, actor, amount, meta);
    }

    // --------- Deposits ---------
    function depositETH(uint256 tokenId) external payable {
        _requireTokenExists(tokenId);
        require(msg.value > 0, "no value");
        ethBalance[tokenId] += msg.value;
        emit DepositedETH(tokenId, msg.sender, msg.value);
        _appendNode(tokenId, lastNodeId[tokenId], EdgeType.DepositETH, address(0), msg.sender, msg.value, bytes32(0));
    }

    function depositERC20(uint256 tokenId, address token, uint256 amount) external {
        _requireTokenExists(tokenId);
        require(amount > 0, "no amount");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        erc20Balance[tokenId][token] += amount;
        emit DepositedERC20(tokenId, token, msg.sender, amount);
        _appendNode(tokenId, lastNodeId[tokenId], EdgeType.DepositERC20, token, msg.sender, amount, bytes32(0));
    }

    // --------- Withdrawals (avatar owner only) ---------
    function withdrawETH(uint256 tokenId, uint256 amount) external nonReentrant {
        _requireOwner(tokenId);
        require(block.timestamp >= unlockTime[tokenId], "locked");
        require(amount <= ethBalance[tokenId], "insufficient");
        ethBalance[tokenId] -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
        emit WithdrawnETH(tokenId, msg.sender, amount);
        _appendNode(tokenId, lastNodeId[tokenId], EdgeType.WithdrawETH, address(0), msg.sender, amount, bytes32(0));
    }

    function withdrawERC20(uint256 tokenId, address token, uint256 amount) external nonReentrant {
        _requireOwner(tokenId);
        require(block.timestamp >= unlockTime[tokenId], "locked");
        require(amount <= erc20Balance[tokenId][token], "insufficient");
        erc20Balance[tokenId][token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);
        emit WithdrawnERC20(tokenId, token, msg.sender, amount);
        _appendNode(tokenId, lastNodeId[tokenId], EdgeType.WithdrawERC20, token, msg.sender, amount, bytes32(0));
    }

    // --------- Settings (owner of avatar) ---------
    function setSavingsGoal(uint256 tokenId, uint256 goalWei) external {
        _requireOwner(tokenId);
        savingsGoal[tokenId] = goalWei;
        emit GoalSet(tokenId, goalWei);
        _appendNode(tokenId, lastNodeId[tokenId], EdgeType.GoalSet, address(0), msg.sender, goalWei, bytes32(0));
    }

    // Allow extending lock, never shortening (safety against tricking buyers)
    function extendUnlock(uint256 tokenId, uint256 newUnlockTime) external {
        _requireOwner(tokenId);
        require(newUnlockTime >= unlockTime[tokenId], "cannot reduce lock");
        unlockTime[tokenId] = newUnlockTime;
        emit UnlockSet(tokenId, newUnlockTime);
        _appendNode(tokenId, lastNodeId[tokenId], EdgeType.LockSet, address(0), msg.sender, newUnlockTime, bytes32(0));
    }

    // --------- Payment approvals (owner of avatar) ---------
    function approveETHSpender(uint256 tokenId, address spender, uint256 amount) external {
        _requireOwner(tokenId);
        ethAllowance[tokenId][spender] = amount;
        emit ApprovedETHSpender(tokenId, spender, amount);
        _appendNode(tokenId, lastNodeId[tokenId], EdgeType.ApproveETH, address(0), msg.sender, amount, bytes32(0));
    }

    function approveERC20Spender(uint256 tokenId, address token, address spender, uint256 amount) external {
        _requireOwner(tokenId);
        erc20Allowance[tokenId][token][spender] = amount;
        emit ApprovedERC20Spender(tokenId, token, spender, amount);
        _appendNode(tokenId, lastNodeId[tokenId], EdgeType.ApproveERC20, token, msg.sender, amount, bytes32(0));
    }

    // --------- Programmatic spend (game/payment integration) ---------
    function spendETH(uint256 tokenId, address to, uint256 amount) external nonReentrant {
        require(block.timestamp >= unlockTime[tokenId], "locked");
        if (msg.sender != cursedAvatar.ownerOf(tokenId)) {
            uint256 allowanceLeft = ethAllowance[tokenId][msg.sender];
            require(allowanceLeft >= amount, "allowance");
            ethAllowance[tokenId][msg.sender] = allowanceLeft - amount;
        }
        require(amount <= ethBalance[tokenId], "insufficient");
        ethBalance[tokenId] -= amount;
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "transfer failed");
        emit SpentETH(tokenId, to, amount, msg.sender);
        _appendNode(tokenId, lastNodeId[tokenId], EdgeType.SpendETH, address(0), msg.sender, amount, bytes32(0));
    }

    function spendERC20(uint256 tokenId, address token, address to, uint256 amount) external nonReentrant {
        require(block.timestamp >= unlockTime[tokenId], "locked");
        if (msg.sender != cursedAvatar.ownerOf(tokenId)) {
            uint256 allowanceLeft = erc20Allowance[tokenId][token][msg.sender];
            require(allowanceLeft >= amount, "allowance");
            erc20Allowance[tokenId][token][msg.sender] = allowanceLeft - amount;
        }
        require(amount <= erc20Balance[tokenId][token], "insufficient");
        erc20Balance[tokenId][token] -= amount;
        IERC20(token).safeTransfer(to, amount);
        emit SpentERC20(tokenId, token, to, amount, msg.sender);
        _appendNode(tokenId, lastNodeId[tokenId], EdgeType.SpendERC20, token, msg.sender, amount, bytes32(0));
    }

    // --------- Creator/AI controls ---------
    function setAIExecutor(address newExecutor) external onlyCreator {
        address old = aiExecutor;
        aiExecutor = newExecutor;
        emit AIExecutorSet(old, newExecutor);
    }

    function setTreeRecording(bool enabled) external onlyCreator {
        treeRecordingEnabled = enabled;
        emit TreeRecordingToggled(enabled);
    }

    // Append custom node for off-chain bookkeeping or branching
    function appendCustomNode(
        uint256 tokenId,
        uint256 parentId,
        uint8 edgeType,
        address token,
        uint256 amount,
        bytes32 meta
    ) external onlyCreator {
        _appendNode(tokenId, parentId, EdgeType(edgeType), token, msg.sender, amount, meta);
    }

    function annotateNode(uint256 tokenId, uint256 nodeId, bytes32 meta) external onlyCreator {
        require(nodeId > 0 && nodeId <= nodeCount[tokenId], "bad nodeId");
        nodes[tokenId][nodeId].meta = meta;
        emit NodeAnnotated(tokenId, nodeId, meta);
    }
}


