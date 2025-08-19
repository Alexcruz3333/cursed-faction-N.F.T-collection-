// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * PiggyBank NFT
 * - Each ERC721 tokenId has a native-ETH vault and optional ERC20 vaults.
 * - Anyone can deposit; only current owner can withdraw.
 * - Balances follow the token on transfer.
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PiggyBankNFT is ERC721, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public nextId = 1;
    string private _baseTokenURI;

    // ETH balances by tokenId
    mapping(uint256 => uint256) public ethBalance;

    // ERC20 balances by tokenId => token => amount
    mapping(uint256 => mapping(address => uint256)) public erc20Balance;

    // Optional savings goal and unlock (unix timestamp)
    mapping(uint256 => uint256) public savingsGoal;
    mapping(uint256 => uint256) public unlockTime;

    event DepositedETH(uint256 indexed tokenId, address indexed from, uint256 amount);
    event WithdrawnETH(uint256 indexed tokenId, address indexed to, uint256 amount);
    event DepositedERC20(uint256 indexed tokenId, address indexed token, address indexed from, uint256 amount);
    event WithdrawnERC20(uint256 indexed tokenId, address indexed token, address indexed to, uint256 amount);
    event GoalSet(uint256 indexed tokenId, uint256 goalWei);
    event UnlockSet(uint256 indexed tokenId, uint256 unlockTime);

    constructor(string memory baseURI_) ERC721("PiggyBank NFT", "PIGGY") {
        _baseTokenURI = baseURI_;
    }

    // --------- Mint ---------
    function mint(address to, uint256 goalWei, uint256 unlockAt) external onlyOwner returns (uint256 id) {
        id = nextId++;
        _safeMint(to, id);
        if (goalWei > 0) savingsGoal[id] = goalWei;
        if (unlockAt > 0) unlockTime[id] = unlockAt;
        emit GoalSet(id, goalWei);
        emit UnlockSet(id, unlockAt);
    }

    // --------- Deposits ---------
    function depositETH(uint256 tokenId) external payable {
        require(_exists(tokenId), "token !exist");
        require(msg.value > 0, "no value");
        ethBalance[tokenId] += msg.value;
        emit DepositedETH(tokenId, msg.sender, msg.value);
    }

    function depositERC20(uint256 tokenId, address token, uint256 amount) external {
        require(_exists(tokenId), "token !exist");
        require(amount > 0, "no amount");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        erc20Balance[tokenId][token] += amount;
        emit DepositedERC20(tokenId, token, msg.sender, amount);
    }

    // --------- Withdrawals (owner only) ---------
    function withdrawETH(uint256 tokenId, uint256 amount) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "not owner");
        require(block.timestamp >= unlockTime[tokenId], "locked");
        require(amount <= ethBalance[tokenId], "insufficient");
        ethBalance[tokenId] -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
        emit WithdrawnETH(tokenId, msg.sender, amount);
    }

    function withdrawERC20(uint256 tokenId, address token, uint256 amount) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "not owner");
        require(block.timestamp >= unlockTime[tokenId], "locked");
        require(amount <= erc20Balance[tokenId][token], "insufficient");
        erc20Balance[tokenId][token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);
        emit WithdrawnERC20(tokenId, token, msg.sender, amount);
    }

    // --------- Settings (owner of token) ---------
    function setSavingsGoal(uint256 tokenId, uint256 goalWei) external {
        require(ownerOf(tokenId) == msg.sender, "not owner");
        savingsGoal[tokenId] = goalWei;
        emit GoalSet(tokenId, goalWei);
    }

    // Allow extending lock, never shortening (safety against tricking buyers)
    function extendUnlock(uint256 tokenId, uint256 newUnlockTime) external {
        require(ownerOf(tokenId) == msg.sender, "not owner");
        require(newUnlockTime >= unlockTime[tokenId], "cannot reduce lock");
        unlockTime[tokenId] = newUnlockTime;
        emit UnlockSet(tokenId, newUnlockTime);
    }

    // --------- Metadata ---------
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata newBase) external onlyOwner {
        _baseTokenURI = newBase;
    }
}
