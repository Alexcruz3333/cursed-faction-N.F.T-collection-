using System;
using UnityEngine;

namespace PiggyBankNFT
{
    /// <summary>
    /// Provides mock data for PiggyBank NFT system during development and testing.
    /// This allows developers to test the system without connecting to real blockchain networks.
    /// </summary>
    public static class MockPiggyBankData
    {
        // Mock PiggyBank data
        public static decimal MockBalance = 0.5m;
        public static decimal MockGoal = 1.0m;
        public static DateTime? MockUnlockTime = null;
        
        // Mock transaction history
        public static readonly MockTransaction[] MockTransactions = {
            new MockTransaction {
                id = "tx_001",
                type = TransactionType.Deposit,
                amount = 0.1m,
                reason = "First Blood Achievement",
                timestamp = DateTime.Now.AddDays(-2),
                status = TransactionStatus.Confirmed
            },
            new MockTransaction {
                id = "tx_002",
                type = TransactionType.Deposit,
                amount = 0.05m,
                reason = "Victory Royale",
                timestamp = DateTime.Now.AddDays(-1),
                status = TransactionStatus.Confirmed
            },
            new MockTransaction {
                id = "tx_003",
                type = TransactionType.Deposit,
                amount = 0.025m,
                reason = "Daily Login Bonus",
                timestamp = DateTime.Now.AddHours(-12),
                status = TransactionStatus.Confirmed
            },
            new MockTransaction {
                id = "tx_004",
                type = TransactionType.Withdrawal,
                amount = 0.1m,
                reason = "Emergency Funds",
                timestamp = DateTime.Now.AddHours(-6),
                status = TransactionStatus.Confirmed
            }
        };
        
        // Mock achievements
        public static readonly MockAchievement[] MockAchievements = {
            new MockAchievement {
                id = "first_blood",
                name = "First Blood",
                description = "Eliminate your first opponent",
                ethReward = 0.01m,
                rarity = AchievementRarity.Common,
                isUnlocked = true,
                unlockDate = DateTime.Now.AddDays(-5)
            },
            new MockAchievement {
                id = "victory_royale",
                name = "Victory Royale",
                description = "Win a battle royale match",
                ethReward = 0.05m,
                rarity = AchievementRarity.Rare,
                isUnlocked = true,
                unlockDate = DateTime.Now.AddDays(-3)
            },
            new MockAchievement {
                id = "elimination_master",
                name = "Elimination Master",
                description = "Eliminate 100 opponents",
                ethReward = 0.1m,
                rarity = AchievementRarity.Epic,
                isUnlocked = false,
                currentProgress = 67,
                progressRequired = 100
            },
            new MockAchievement {
                id = "survival_expert",
                name = "Survival Expert",
                description = "Survive for 20 minutes in a single match",
                ethReward = 0.025m,
                rarity = AchievementRarity.Uncommon,
                isUnlocked = false,
                currentProgress = 0,
                progressRequired = 1
            },
            new MockAchievement {
                id = "tournament_champion",
                name = "Tournament Champion",
                description = "Win a tournament",
                ethReward = 0.5m,
                rarity = AchievementRarity.Legendary,
                isUnlocked = false,
                currentProgress = 0,
                progressRequired = 1
            }
        };
        
        // Mock savings goals
        public static readonly MockSavingsGoal[] MockSavingsGoals = {
            new MockSavingsGoal {
                id = "goal_001",
                name = "Gaming Setup",
                targetAmount = 2.0m,
                currentAmount = 0.5m,
                deadline = DateTime.Now.AddMonths(3),
                isActive = true
            },
            new MockSavingsGoal {
                id = "goal_002",
                name = "Emergency Fund",
                targetAmount = 1.0m,
                currentAmount = 0.5m,
                deadline = DateTime.Now.AddMonths(1),
                isActive = true
            },
            new MockSavingsGoal {
                id = "goal_003",
                name = "Holiday Trip",
                targetAmount = 5.0m,
                currentAmount = 0.0m,
                deadline = DateTime.Now.AddMonths(6),
                isActive = false
            }
        };
        
        // Mock statistics
        public static readonly MockStatistics MockStats = new MockStatistics {
            totalDeposits = 0.175m,
            totalWithdrawals = 0.1m,
            totalAchievements = 5,
            unlockedAchievements = 2,
            totalPlayTime = TimeSpan.FromHours(48),
            averageSessionLength = TimeSpan.FromMinutes(45),
            favoriteGameMode = "Battle Royale",
            totalMatches = 156,
            totalWins = 23,
            winRate = 0.147f
        };
        
        /// <summary>
        /// Resets all mock data to default values
        /// </summary>
        public static void ResetMockData()
        {
            MockBalance = 0.5m;
            MockGoal = 1.0m;
            MockUnlockTime = null;
            
            Debug.Log("Mock PiggyBank data reset to defaults");
        }
        
        /// <summary>
        /// Generates random mock data for testing
        /// </summary>
        public static void GenerateRandomMockData()
        {
            var random = new System.Random();
            
            MockBalance = (decimal)(random.NextDouble() * 2.0); // 0.0 to 2.0 ETH
            MockGoal = (decimal)(random.NextDouble() * 5.0) + 0.5m; // 0.5 to 5.5 ETH
            
            // Random unlock time (50% chance of being locked)
            if (random.NextDouble() < 0.5)
            {
                MockUnlockTime = DateTime.Now.AddDays(random.Next(1, 90));
            }
            else
            {
                MockUnlockTime = null;
            }
            
            Debug.Log("Generated random mock data for testing");
        }
        
        /// <summary>
        /// Simulates a deposit transaction
        /// </summary>
        public static void SimulateDeposit(decimal amount, string reason)
        {
            MockBalance += amount;
            
            // Add to transaction history
            var newTransaction = new MockTransaction {
                id = $"tx_{DateTime.Now.Ticks}",
                type = TransactionType.Deposit,
                amount = amount,
                reason = reason,
                timestamp = DateTime.Now,
                status = TransactionStatus.Confirmed
            };
            
            Debug.Log($"Simulated deposit: +{amount} ETH for {reason}. New balance: {MockBalance} ETH");
        }
        
        /// <summary>
        /// Simulates a withdrawal transaction
        /// </summary>
        public static void SimulateWithdrawal(decimal amount, string reason)
        {
            if (amount <= MockBalance)
            {
                MockBalance -= amount;
                
                // Add to transaction history
                var newTransaction = new MockTransaction {
                    id = $"tx_{DateTime.Now.Ticks}",
                    type = TransactionType.Withdrawal,
                    amount = amount,
                    reason = reason,
                    timestamp = DateTime.Now,
                    status = TransactionStatus.Confirmed
                };
                
                Debug.Log($"Simulated withdrawal: -{amount} ETH for {reason}. New balance: {MockBalance} ETH");
            }
            else
            {
                Debug.LogWarning($"Cannot withdraw {amount} ETH: insufficient balance ({MockBalance} ETH)");
            }
        }
        
        /// <summary>
        /// Gets mock data summary for debugging
        /// </summary>
        public static string GetMockDataSummary()
        {
            return $"Mock Data Summary:\n" +
                   $"Balance: {MockBalance} ETH\n" +
                   $"Goal: {MockGoal} ETH\n" +
                   $"Unlock Time: {(MockUnlockTime?.ToString() ?? "No lock")}\n" +
                   $"Progress: {GetProgressPercentage():P1}\n" +
                   $"Transactions: {MockTransactions.Length}\n" +
                   $"Achievements: {MockAchievements.Length} total, {GetUnlockedAchievementCount()} unlocked";
        }
        
        private static float GetProgressPercentage()
        {
            if (MockGoal <= 0) return 0f;
            return Mathf.Clamp01((float)(MockBalance / MockGoal));
        }
        
        private static int GetUnlockedAchievementCount()
        {
            int count = 0;
            foreach (var achievement in MockAchievements)
            {
                if (achievement.isUnlocked) count++;
            }
            return count;
        }
    }
    
    // Data structures for mock data
    [System.Serializable]
    public class MockTransaction
    {
        public string id;
        public TransactionType type;
        public decimal amount;
        public string reason;
        public DateTime timestamp;
        public TransactionStatus status;
    }
    
    [System.Serializable]
    public class MockAchievement
    {
        public string id;
        public string name;
        public string description;
        public decimal ethReward;
        public AchievementRarity rarity;
        public bool isUnlocked;
        public DateTime unlockDate;
        public int currentProgress;
        public int progressRequired;
    }
    
    [System.Serializable]
    public class MockSavingsGoal
    {
        public string id;
        public string name;
        public decimal targetAmount;
        public decimal currentAmount;
        public DateTime deadline;
        public bool isActive;
    }
    
    [System.Serializable]
    public class MockStatistics
    {
        public decimal totalDeposits;
        public decimal totalWithdrawals;
        public int totalAchievements;
        public int unlockedAchievements;
        public TimeSpan totalPlayTime;
        public TimeSpan averageSessionLength;
        public string favoriteGameMode;
        public int totalMatches;
        public int totalWins;
        public float winRate;
    }
    
    public enum TransactionType
    {
        Deposit,
        Withdrawal
    }
    
    public enum TransactionStatus
    {
        Pending,
        Confirmed,
        Failed
    }
    
    public enum AchievementRarity
    {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }
}
