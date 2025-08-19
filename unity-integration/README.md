# 🎮 Unity + PiggyBank NFT Integration

Integrate your Unity game with the PiggyBank NFT system to create a revolutionary gaming experience where players can earn, save, and manage crypto rewards directly within your game!

## ✨ What This Integration Enables

- **🎯 In-Game Rewards**: Players earn ETH/crypto for achievements, wins, or participation
- **🏦 Automatic Deposits**: Game automatically deposits rewards to player's PiggyBank NFT
- **💎 NFT Ownership**: Players can view and manage their PiggyBank NFTs from within the game
- **🔒 Time-Locked Savings**: Implement savings goals and time locks for disciplined gaming rewards
- **🎁 Gift System**: Players can gift rewards to friends' PiggyBank NFTs
- **📊 Progress Tracking**: Visual progress bars and statistics for savings goals

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Unity Game   │    │  Web3 Bridge    │    │ PiggyBank NFT   │
│                 │◄──►│   (C#/JS)      │◄──►│   Contract      │
│ • Achievement  │    │ • Wallet Conn.  │    │ • Vault System  │
│ • Rewards      │    │ • Contract Int. │    │ • Time Locks    │
│ • UI Elements  │    │ • Transaction   │    │ • Goals         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Import the Package

1. Download the `PiggyBankNFT-Unity.unitypackage`
2. Import into your Unity project
3. The package will create a `PiggyBankNFT` folder in your Assets

### 2. Basic Setup

```csharp
// Add to your GameManager or main game script
using PiggyBankNFT;

public class GameManager : MonoBehaviour
{
    [SerializeField] private PiggyBankManager piggyBankManager;
    
    void Start()
    {
        // Initialize the PiggyBank system
        piggyBankManager.Initialize();
    }
    
    // Example: Award player for achievement
    public void AwardPlayerForAchievement(string achievementId)
    {
        decimal rewardAmount = GetRewardAmount(achievementId);
        piggyBankManager.DepositReward(rewardAmount, "Achievement: " + achievementId);
    }
}
```

### 3. Configure Your Contract

In the PiggyBankManager component:
- Set your deployed contract address
- Configure network settings (Base mainnet/testnet)
- Set default savings goals and time locks

## 🎯 Core Features

### Achievement & Reward System

```csharp
public class AchievementSystem : MonoBehaviour
{
    [SerializeField] private PiggyBankManager piggyBankManager;
    
    [System.Serializable]
    public class Achievement
    {
        public string id;
        public string name;
        public decimal ethReward;
        public Sprite icon;
    }
    
    public List<Achievement> achievements = new List<Achievement>();
    
    public void UnlockAchievement(string achievementId)
    {
        var achievement = achievements.Find(a => a.id == achievementId);
        if (achievement != null)
        {
            // Show achievement UI
            ShowAchievementUnlocked(achievement);
            
            // Deposit reward to PiggyBank NFT
            piggyBankManager.DepositReward(achievement.ethReward, achievement.name);
        }
    }
}
```

### In-Game PiggyBank UI

```csharp
public class PiggyBankUI : MonoBehaviour
{
    [SerializeField] private PiggyBankManager piggyBankManager;
    [SerializeField] private Text balanceText;
    [SerializeField] private Slider progressBar;
    [SerializeField] private Text goalText;
    
    void Update()
    {
        // Update UI with real-time data
        UpdateBalanceDisplay();
        UpdateProgressBar();
        UpdateGoalDisplay();
    }
    
    private void UpdateBalanceDisplay()
    {
        var balance = piggyBankManager.GetCurrentBalance();
        balanceText.text = $"{balance:F4} ETH";
    }
    
    private void UpdateProgressBar()
    {
        var progress = piggyBankManager.GetProgressToGoal();
        progressBar.value = progress;
    }
}
```

### Savings Goals & Time Locks

```csharp
public class SavingsGoalManager : MonoBehaviour
{
    [SerializeField] private PiggyBankManager piggyBankManager;
    
    public void SetSavingsGoal(decimal goalAmount)
    {
        piggyBankManager.SetSavingsGoal(goalAmount);
        ShowGoalSetConfirmation(goalAmount);
    }
    
    public void SetTimeLock(int daysFromNow)
    {
        var unlockTime = DateTime.Now.AddDays(days);
        piggyBankManager.SetTimeLock(unlockTime);
        ShowTimeLockSetConfirmation(unlockTime);
    }
    
    public bool CanWithdraw()
    {
        return piggyBankManager.IsUnlocked();
    }
}
```

## 🎨 UI Components

### Achievement Popup

```csharp
public class AchievementPopup : MonoBehaviour
{
    [SerializeField] private Text titleText;
    [SerializeField] private Text rewardText;
    [SerializeField] private Image iconImage;
    [SerializeField] private Animator animator;
    
    public void ShowAchievement(Achievement achievement)
    {
        titleText.text = achievement.name;
        rewardText.text = $"+{achievement.ethReward:F4} ETH";
        iconImage.sprite = achievement.icon;
        
        animator.SetTrigger("Show");
        
        // Auto-hide after 3 seconds
        StartCoroutine(AutoHide(3f));
    }
}
```

### PiggyBank Dashboard

```csharp
public class PiggyBankDashboard : MonoBehaviour
{
    [SerializeField] private PiggyBankManager piggyBankManager;
    [SerializeField] private GameObject dashboardPanel;
    [SerializeField] private Text totalBalanceText;
    [SerializeField] private Text savingsGoalText;
    [SerializeField] private Text unlockTimeText;
    [SerializeField] private Button withdrawButton;
    [SerializeField] private Button setGoalButton;
    
    public void ShowDashboard()
    {
        dashboardPanel.SetActive(true);
        RefreshDashboardData();
    }
    
    private void RefreshDashboardData()
    {
        var balance = piggyBankManager.GetCurrentBalance();
        var goal = piggyBankManager.GetSavingsGoal();
        var unlockTime = piggyBankManager.GetUnlockTime();
        
        totalBalanceText.text = $"{balance:F4} ETH";
        savingsGoalText.text = goal > 0 ? $"{goal:F4} ETH" : "Not set";
        unlockTimeText.text = unlockTime.HasValue ? unlockTime.Value.ToString("MMM dd, yyyy") : "No lock";
        
        withdrawButton.interactable = piggyBankManager.CanWithdraw();
    }
}
```

## 🔧 Configuration

### Network Settings

```csharp
[System.Serializable]
public class NetworkConfig
{
    public string networkName = "Base Mainnet";
    public string rpcUrl = "https://mainnet.base.org";
    public string contractAddress = "0xYourContractAddress";
    public int chainId = 8453;
    public string blockExplorer = "https://basescan.org";
}
```

### Achievement Configuration

```csharp
[System.Serializable]
public class AchievementConfig
{
    public string id;
    public string displayName;
    public decimal ethReward;
    public string description;
    public Sprite icon;
    public bool isUnlocked;
    public DateTime unlockDate;
}
```

## 🎮 Game Integration Examples

### Battle Royale Rewards

```csharp
public class BattleRoyaleManager : MonoBehaviour
{
    [SerializeField] private PiggyBankManager piggyBankManager;
    
    public void OnPlayerWins()
    {
        decimal winReward = 0.01m; // 0.01 ETH for winning
        piggyBankManager.DepositReward(winReward, "Battle Royale Victory!");
        
        // Show victory screen with reward
        ShowVictoryScreen(winReward);
    }
    
    public void OnPlayerEliminates(int eliminationCount)
    {
        decimal eliminationReward = 0.001m * eliminationCount; // 0.001 ETH per elimination
        if (eliminationReward > 0)
        {
            piggyBankManager.DepositReward(eliminationReward, $"Elimination Bonus ({eliminationCount})");
        }
    }
}
```

### Daily Login Rewards

```csharp
public class DailyRewardSystem : MonoBehaviour
{
    [SerializeField] private PiggyBankManager piggyBankManager;
    
    [System.Serializable]
    public class DailyReward
    {
        public int day;
        public decimal ethReward;
        public string description;
    }
    
    public List<DailyReward> dailyRewards = new List<DailyReward>();
    
    public void CheckDailyReward()
    {
        if (CanClaimDailyReward())
        {
            var today = DateTime.Now.DayOfYear;
            var reward = dailyRewards.Find(r => r.day == today);
            
            if (reward != null)
            {
                piggyBankManager.DepositReward(reward.ethReward, $"Daily Reward - Day {reward.day}");
                ShowDailyRewardClaimed(reward);
            }
        }
    }
}
```

### Tournament Prizes

```csharp
public class TournamentManager : MonoBehaviour
{
    [SerializeField] private PiggyBankManager piggyBankManager;
    
    public void AwardTournamentPrizes(List<PlayerResult> results)
    {
        foreach (var result in results)
        {
            decimal prize = CalculatePrize(result.rank);
            if (prize > 0)
            {
                piggyBankManager.DepositReward(prize, $"Tournament Prize - Rank #{result.rank}");
            }
        }
    }
    
    private decimal CalculatePrize(int rank)
    {
        switch (rank)
        {
            case 1: return 0.1m;  // 1st place: 0.1 ETH
            case 2: return 0.05m; // 2nd place: 0.05 ETH
            case 3: return 0.025m; // 3rd place: 0.025 ETH
            default: return 0.001m; // Participation: 0.001 ETH
        }
    }
}
```

## 🔒 Security Features

- **Wallet Connection**: Secure MetaMask/WalletConnect integration
- **Transaction Signing**: All transactions require player approval
- **Gas Estimation**: Automatic gas cost calculation and display
- **Error Handling**: Graceful fallbacks for network issues
- **Rate Limiting**: Prevent spam transactions

## 📱 Mobile Support

- **Mobile Wallets**: Support for mobile wallet apps
- **Responsive UI**: Optimized for mobile devices
- **Touch Controls**: Touch-friendly interface elements
- **Offline Mode**: Graceful handling of network disconnections

## 🚀 Performance Optimization

- **Async Operations**: Non-blocking blockchain interactions
- **Caching**: Local storage of frequently accessed data
- **Batch Operations**: Efficient handling of multiple transactions
- **Memory Management**: Proper cleanup of Web3 resources

## 🧪 Testing

### Test Mode

```csharp
public class PiggyBankManager : MonoBehaviour
{
    [SerializeField] private bool testMode = true;
    
    void Start()
    {
        if (testMode)
        {
            // Use testnet configuration
            InitializeTestMode();
        }
        else
        {
            // Use mainnet configuration
            InitializeMainnet();
        }
    }
}
```

### Mock Data

```csharp
public class MockPiggyBankData : MonoBehaviour
{
    public static decimal MockBalance = 0.5m;
    public static decimal MockGoal = 1.0m;
    public static DateTime? MockUnlockTime = null;
    
    public static void ResetMockData()
    {
        MockBalance = 0.5m;
        MockGoal = 1.0m;
        MockUnlockTime = null;
    }
}
```

## 📚 Documentation

- [API Reference](./docs/api-reference.md)
- [UI Components](./docs/ui-components.md)
- [Game Integration Examples](./docs/game-examples.md)
- [Troubleshooting](./docs/troubleshooting.md)

## 🤝 Support

- **Unity Forum**: [PiggyBank NFT Thread](https://forum.unity.com/)
- **Discord**: [Join our community](https://discord.gg/piggybanknft)
- **GitHub**: [Issues & Discussions](https://github.com/your-repo)

---

**Transform your Unity game with real crypto rewards!** 🎮💰
