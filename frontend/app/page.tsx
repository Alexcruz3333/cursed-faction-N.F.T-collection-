"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState } from 'react';
import { PiggyBank, Coins, Lock, Target, Gift, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

// Contract ABI (simplified for demo)
const CONTRACT_ABI = [
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "ethBalance", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "savingsGoal", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "unlockTime", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "depositETH", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }, { name: "amount", type: "uint256" }], name: "withdrawETH", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }, { name: "goalWei", type: "uint256" }], name: "setSavingsGoal", outputs: [], stateMutability: "nonpayable", type: "function" },
] as const;

const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // Update with deployed address

export default function Home() {
  const { address, isConnected } = useAccount();
  const [selectedTokenId, setSelectedTokenId] = useState<number>(1);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [newGoal, setNewGoal] = useState<string>("");

  // Read contract data
  const { data: ethBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'ethBalance',
    args: [BigInt(selectedTokenId)],
  });

  const { data: savingsGoal } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'savingsGoal',
    args: [BigInt(selectedTokenId)],
  });

  const { data: unlockTime } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'unlockTime',
    args: [BigInt(selectedTokenId)],
  });

  // Write contract functions
  const { writeContract: deposit, isPending: isDepositing } = useWriteContract();
  const { writeContract: withdraw, isPending: isWithdrawing } = useWriteContract();
  const { writeContract: setGoal, isPending: isSettingGoal } = useWriteContract();

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    
    deposit({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'depositETH',
      args: [BigInt(selectedTokenId)],
      value: parseEther(depositAmount),
    });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    
    withdraw({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'withdrawETH',
      args: [BigInt(selectedTokenId), parseEther(withdrawAmount)],
    });
  };

  const handleSetGoal = () => {
    if (!newGoal || parseFloat(newGoal) <= 0) return;
    
    setGoal({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'setSavingsGoal',
      args: [BigInt(selectedTokenId), parseEther(newGoal)],
    });
  };

  const progressPercentage = savingsGoal && ethBalance 
    ? Math.min((Number(ethBalance) / Number(savingsGoal)) * 100, 100)
    : 0;

  const isLocked = unlockTime && unlockTime > BigInt(Math.floor(Date.now() / 1000));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <PiggyBank className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">PiggyBank NFT</h1>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="text-center py-20">
            <PiggyBank className="h-24 w-24 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to PiggyBank NFT
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              The first NFT that acts like a crypto piggy bank! Anyone can contribute funds, 
              but only the current owner can withdraw. Perfect for savings goals, gifts, and tips.
            </p>
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-4">How it works:</h3>
              <ul className="text-left space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <Gift className="h-4 w-4 text-green-500" />
                  <span>Anyone can deposit ETH to any NFT</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  <span>Only the current owner can withdraw</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span>Set savings goals and time locks</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span>Balances follow the NFT when transferred</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Token Selection */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Select PiggyBank NFT</h2>
              <div className="flex space-x-4">
                {[1, 2, 3].map((id) => (
                  <button
                    key={id}
                    onClick={() => setSelectedTokenId(id)}
                    className={cn(
                      "px-4 py-2 rounded-lg border-2 transition-colors",
                      selectedTokenId === id
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 hover:border-purple-300"
                    )}
                  >
                    NFT #{id}
                  </button>
                ))}
              </div>
            </div>

            {/* NFT Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Balance & Actions */}
              <div className="space-y-6">
                {/* Balance Card */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Current Balance</h3>
                    <Coins className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {ethBalance ? formatEther(ethBalance) : "0"} ETH
                  </div>
                  {savingsGoal && savingsGoal > 0n && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress to goal</span>
                        <span>{progressPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Goal: {formatEther(savingsGoal)} ETH
                      </div>
                    </div>
                  )}
                </div>

                {/* Deposit Card */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">💝 Gift This PiggyBank</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (ETH)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.01"
                      />
                    </div>
                    <button
                      onClick={handleDeposit}
                      disabled={isDepositing || !depositAmount}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isDepositing ? "Depositing..." : "🎁 Send Gift"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Owner Actions */}
              <div className="space-y-6">
                {/* Owner Actions */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">🏦 Owner Actions</h3>
                  
                  {/* Withdraw */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Withdraw Amount (ETH)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.01"
                      />
                      <button
                        onClick={handleWithdraw}
                        disabled={isWithdrawing || !withdrawAmount || isLocked}
                        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                      </button>
                    </div>
                    {isLocked && (
                      <div className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                        <Lock className="h-4 w-4" />
                        <span>Locked until {new Date(Number(unlockTime) * 1000).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Set Goal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Set Savings Goal (ETH)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="1.0"
                      />
                      <button
                        onClick={handleSetGoal}
                        disabled={isSettingGoal || !newGoal}
                        className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSettingGoal ? "Setting..." : "Set Goal"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">📊 Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Token ID:</span>
                      <span className="font-medium">#{selectedTokenId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Balance:</span>
                      <span className="font-medium">
                        {ethBalance ? formatEther(ethBalance) : "0"} ETH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Savings Goal:</span>
                      <span className="font-medium">
                        {savingsGoal && savingsGoal > 0n ? formatEther(savingsGoal) : "Not set"} ETH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unlock Time:</span>
                      <span className="font-medium">
                        {unlockTime && unlockTime > 0n 
                          ? new Date(Number(unlockTime) * 1000).toLocaleDateString()
                          : "No lock"
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={cn(
                        "font-medium px-2 py-1 rounded-full text-xs",
                        isLocked 
                          ? "bg-red-100 text-red-800" 
                          : "bg-green-100 text-green-800"
                      )}>
                        {isLocked ? "🔒 Locked" : "🔓 Unlocked"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <h3 className="text-lg font-semibold mb-4">🎁 Share Your PiggyBank</h3>
              <p className="text-gray-600 mb-4">
                Anyone can contribute to your PiggyBank NFT! Share this link with friends and family.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
                Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
                <br />
                Token ID: #{selectedTokenId}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
