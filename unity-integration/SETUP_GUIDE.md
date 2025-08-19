# 🎮 Unity Integration Setup Guide

This guide will walk you through integrating the PiggyBank NFT system into your Unity game project.

## 📋 Prerequisites

- **Unity 2022.3 LTS** or newer
- **.NET 4.x** or **.NET Standard 2.1** scripting backend
- **Git** for version control
- Basic understanding of C# and Unity development

## 🚀 Quick Installation

### Method 1: Unity Package Import (Recommended)

1. **Download the package**:
   - Get `PiggyBankNFT-Unity.unitypackage` from the releases
   - Or build it from source (see below)

2. **Import into Unity**:
   - Open your Unity project
   - Go to `Assets > Import Package > Custom Package`
   - Select `PiggyBankNFT-Unity.unitypackage`
   - Click `Import`

3. **Verify installation**:
   - Check that a `PiggyBankNFT` folder appears in your Assets
   - Ensure all scripts compile without errors

### Method 2: Manual Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/piggybank-nft-unity.git
   ```

2. **Copy files**:
   - Copy the `Scripts` folder to your `Assets` folder
   - Copy the `Prefabs` folder to your `Assets` folder
   - Copy the `Materials` and `Audio` folders as needed

3. **Install dependencies**:
   - Add Nethereum package via Package Manager
   - Or use the provided DLLs in the `Plugins` folder

## 🔧 Basic Setup

### 1. Create PiggyBank Manager

1. **Create empty GameObject**:
   - Right-click in Hierarchy → `Create Empty`
   - Rename to `PiggyBankManager`

2. **Add PiggyBankManager script**:
   - Select the GameObject
   - In Inspector, click `Add Component`
   - Search for `PiggyBankManager` and add it

3. **Configure settings**:
   ```csharp
   // In the Inspector, set:
   Contract Address: "0xYourDeployedContractAddress"
   RPC URL: "https://mainnet.base.org" (or testnet)
   Chain ID: 8453 (Base mainnet) or 84532 (testnet)
   Test Mode: true (for development)
   ```

### 2. Create Achievement System

1. **Create empty GameObject**:
   - Rename to `AchievementSystem`

2. **Add AchievementSystem script**:
   - Add the `AchievementSystem` component

3. **Link to PiggyBankManager**:
   - Drag your `PiggyBankManager` GameObject to the `Piggy Bank Manager` field

4. **Configure achievements**:
   - In the Inspector, expand `Achievements`
   - Click `+` to add new achievements
   - Fill in the details for each achievement

### 3. Set Up UI

1. **Create Canvas**:
   - Right-click in Hierarchy → `UI > Canvas`
   - Ensure it has a CanvasScaler component

2. **Import UI prefabs**:
   - Drag the provided UI prefabs into your Canvas
   - Or create your own UI elements

3. **Link UI references**:
   - In PiggyBankManager, drag UI elements to the appropriate fields
   - Balance Text, Goal Text, Progress Bar, etc.

## 🎯 Game Integration Examples

### Battle Royale Game

```csharp
public class BattleRoyaleGame : MonoBehaviour
{
    [SerializeField] private PiggyBankManager piggyBankManager;
    [SerializeField] private AchievementSystem achievementSystem;
    
    public void OnPlayerWins()
    {
        // Award ETH for winning
        piggyBankManager.DepositReward(0.01m, "Victory Royale!");
        
        // Unlock achievement
        achievementSystem.UnlockAchievement("victory_royale");
        
        // Show victory screen
        ShowVictoryScreen();
    }
    
    public void OnPlayerEliminates(int eliminationCount)
    {
        // Award ETH per elimination
        decimal reward = 0.001m * eliminationCount;
        if (reward > 0)
        {
            piggyBankManager.DepositReward(reward, $"Elimination Bonus ({eliminationCount})");
        }
        
        // Update elimination achievement progress
        achievementSystem.AddProgress("elimination_master", eliminationCount);
    }
}
```

### RPG Game

```csharp
public class RPGGame : MonoBehaviour
{
    [SerializeField] private PiggyBankManager piggyBankManager;
    
    public void OnQuestCompleted(Quest quest)
    {
        // Award ETH for quest completion
        decimal reward = quest.difficulty * 0.005m;
        piggyBankManager.DepositReward(reward, $"Quest: {quest.name}");
        
        // Unlock quest-related achievements
        if (quest.type == QuestType.MainStory)
        {
            achievementSystem.UnlockAchievement("main_quest_complete");
        }
    }
    
    public void OnLevelUp(int newLevel)
    {
        // Award ETH for leveling up
        decimal reward = 0.01m * newLevel;
        piggyBankManager.DepositReward(reward, $"Level Up: {newLevel}");
        
        // Update level achievement
        achievementSystem.UpdateProgress("level_master", newLevel);
    }
}
```

### Racing Game

```csharp
public class RacingGame : MonoBehaviour
{
    [SerializeField] private PiggyBankManager piggyBankManager;
    
    public void OnRaceCompleted(RaceResult result)
    {
        decimal reward = 0;
        
        switch (result.position)
        {
            case 1: reward = 0.02m; break; // 1st place
            case 2: reward = 0.01m; break; // 2nd place
            case 3: reward = 0.005m; break; // 3rd place
            default: reward = 0.001m; break; // Participation
        }
        
        // Award ETH
        piggyBankManager.DepositReward(reward, $"Race Position: #{result.position}");
        
        // Update racing achievements
        if (result.position == 1)
        {
            achievementSystem.UnlockAchievement("first_place");
        }
        
        // Update total races achievement
        achievementSystem.AddProgress("racing_enthusiast", 1);
    }
}
```

## 🎨 UI Customization

### Custom Achievement Popup

```csharp
public class CustomAchievementPopup : MonoBehaviour
{
    [SerializeField] private Text titleText;
    [SerializeField] private Text rewardText;
    [SerializeField] private Image iconImage;
    [SerializeField] private Animator animator;
    
    public void ShowAchievement(Achievement achievement)
    {
        titleText.text = achievement.displayName;
        rewardText.text = $"+{achievement.ethReward:F4} ETH";
        iconImage.sprite = achievement.icon;
        
        // Custom animation
        animator.SetTrigger("Show");
        
        // Auto-hide
        StartCoroutine(AutoHide(3f));
    }
    
    private IEnumerator AutoHide(float delay)
    {
        yield return new WaitForSeconds(delay);
        animator.SetTrigger("Hide");
    }
}
```

### Custom PiggyBank Dashboard

```csharp
public class CustomPiggyBankDashboard : MonoBehaviour
{
    [SerializeField] private PiggyBankManager piggyBankManager;
    [SerializeField] private GameObject dashboardPanel;
    
    [Header("UI Elements")]
    [SerializeField] private Text balanceText;
    [SerializeField] private Text goalText;
    [SerializeField] private Slider progressBar;
    [SerializeField] private Button withdrawButton;
    [SerializeField] private Button setGoalButton;
    
    void Start()
    {
        // Subscribe to events
        piggyBankManager.OnBalanceChanged += UpdateBalanceDisplay;
        piggyBankManager.OnGoalChanged += UpdateGoalDisplay;
    }
    
    private void UpdateBalanceDisplay(decimal balance)
    {
        balanceText.text = $"{balance:F4} ETH";
        
        // Update progress bar
        float progress = piggyBankManager.GetProgressToGoal();
        progressBar.value = progress;
        
        // Update withdraw button
        withdrawButton.interactable = piggyBankManager.CanWithdraw();
    }
    
    private void UpdateGoalDisplay(decimal goal)
    {
        goalText.text = goal > 0 ? $"{goal:F4} ETH" : "Not set";
    }
}
```

## 🔒 Security Considerations

### 1. Test Mode vs Production

```csharp
public class PiggyBankManager : MonoBehaviour
{
    [SerializeField] private bool testMode = true;
    
    void Start()
    {
        if (testMode)
        {
            // Use mock data and simulated transactions
            InitializeTestMode();
        }
        else
        {
            // Use real blockchain network
            InitializeWeb3();
        }
    }
}
```

### 2. Input Validation

```csharp
public void DepositReward(decimal amount, string reason)
{
    // Validate input
    if (amount <= 0)
    {
        Debug.LogError("Deposit amount must be positive");
        return;
    }
    
    if (string.IsNullOrEmpty(reason))
    {
        Debug.LogError("Deposit reason cannot be empty");
        return;
    }
    
    // Validate amount limits
    if (amount > 1.0m) // Max 1 ETH per deposit
    {
        Debug.LogError("Deposit amount exceeds maximum limit");
        return;
    }
    
    // Proceed with deposit
    PerformDeposit(amount, reason);
}
```

### 3. Rate Limiting

```csharp
public class RateLimiter : MonoBehaviour
{
    private Dictionary<string, float> lastActionTimes = new Dictionary<string, float>();
    private const float MIN_ACTION_INTERVAL = 1.0f; // 1 second between actions
    
    public bool CanPerformAction(string actionId)
    {
        if (lastActionTimes.TryGetValue(actionId, out float lastTime))
        {
            if (Time.time - lastTime < MIN_ACTION_INTERVAL)
            {
                return false;
            }
        }
        
        lastActionTimes[actionId] = Time.time;
        return true;
    }
}
```

## 🧪 Testing

### 1. Test Mode Setup

```csharp
public class TestModeManager : MonoBehaviour
{
    [SerializeField] private PiggyBankManager piggyBankManager;
    [SerializeField] private Button testDepositButton;
    [SerializeField] private Button testWithdrawButton;
    [SerializeField] private Button testAchievementButton;
    
    void Start()
    {
        if (piggyBankManager.testMode)
        {
            SetupTestButtons();
        }
    }
    
    private void SetupTestButtons()
    {
        testDepositButton.onClick.AddListener(() => {
            piggyBankManager.DepositReward(0.01m, "Test Deposit");
        });
        
        testWithdrawButton.onClick.AddListener(() => {
            piggyBankManager.Withdraw(0.01m);
        });
        
        testAchievementButton.onClick.AddListener(() => {
            achievementSystem.UnlockAchievement("test_achievement");
        });
    }
}
```

### 2. Mock Data Testing

```csharp
public class MockDataTester : MonoBehaviour
{
    void Start()
    {
        // Generate random test data
        MockPiggyBankData.GenerateRandomMockData();
        
        // Log mock data summary
        Debug.Log(MockPiggyBankData.GetMockDataSummary());
        
        // Test various scenarios
        TestDeposits();
        TestWithdrawals();
        TestAchievements();
    }
    
    private void TestDeposits()
    {
        MockPiggyBankData.SimulateDeposit(0.05m, "Test Achievement");
        MockPiggyBankData.SimulateDeposit(0.1m, "Test Victory");
    }
    
    private void TestWithdrawals()
    {
        MockPiggyBankData.SimulateWithdrawal(0.02m, "Test Withdrawal");
    }
    
    private void TestAchievements()
    {
        // Test achievement unlocking
        var achievementSystem = FindObjectOfType<AchievementSystem>();
        if (achievementSystem != null)
        {
            achievementSystem.UnlockAchievement("first_blood");
        }
    }
}
```

## 📱 Mobile Optimization

### 1. Touch Controls

```csharp
public class TouchOptimizedUI : MonoBehaviour
{
    [SerializeField] private float touchDelay = 0.1f;
    private float lastTouchTime = 0f;
    
    void Update()
    {
        if (Input.touchCount > 0)
        {
            Touch touch = Input.GetTouch(0);
            
            if (touch.phase == TouchPhase.Began)
            {
                if (Time.time - lastTouchTime > touchDelay)
                {
                    HandleTouch(touch.position);
                    lastTouchTime = Time.time;
                }
            }
        }
    }
    
    private void HandleTouch(Vector2 touchPosition)
    {
        // Handle touch input
        Ray ray = Camera.main.ScreenPointToRay(touchPosition);
        if (Physics.Raycast(ray, out RaycastHit hit))
        {
            // Handle touch on game objects
        }
    }
}
```

### 2. Performance Optimization

```csharp
public class PerformanceOptimizer : MonoBehaviour
{
    [SerializeField] private float updateInterval = 0.5f; // Update UI every 0.5 seconds
    private float lastUpdateTime = 0f;
    
    void Update()
    {
        if (Time.time - lastUpdateTime > updateInterval)
        {
            UpdateUI();
            lastUpdateTime = Time.time;
        }
    }
    
    private void UpdateUI()
    {
        // Update UI elements less frequently for better performance
        UpdateBalanceDisplay();
        UpdateProgressBar();
    }
}
```

## 🚀 Deployment

### 1. Build Settings

1. **Switch to Production Mode**:
   - Set `Test Mode = false` in PiggyBankManager
   - Update contract address to mainnet
   - Update RPC URL to mainnet

2. **Build Configuration**:
   - Set appropriate build target (PC, Mobile, Console)
   - Configure quality settings
   - Set up signing and publishing

### 2. Post-Build Testing

1. **Test on target platform**:
   - Verify wallet connection works
   - Test all PiggyBank functions
   - Ensure UI displays correctly

2. **Monitor for errors**:
   - Check console logs
   - Monitor blockchain transactions
   - Verify contract interactions

## 🆘 Troubleshooting

### Common Issues

**Scripts won't compile**:
- Ensure .NET version is correct
- Check for missing dependencies
- Verify script file names match class names

**UI not displaying**:
- Check Canvas settings
- Verify UI references are linked
- Ensure UI elements are active

**Blockchain connection fails**:
- Verify RPC URL is correct
- Check network connectivity
- Ensure contract address is valid

**Achievements not unlocking**:
- Check achievement IDs match
- Verify achievement system is linked
- Check for script errors in console

### Getting Help

- **Unity Forums**: Search for PiggyBank NFT threads
- **Discord**: Join our community server
- **GitHub**: Check issues and discussions
- **Documentation**: Review this guide and API docs

## 🎉 Next Steps

1. **Test thoroughly** in test mode
2. **Customize UI** to match your game's style
3. **Add achievements** specific to your game
4. **Deploy to testnet** for final testing
5. **Launch on mainnet** with real rewards
6. **Monitor and iterate** based on player feedback

---

**Happy coding! Your game is now ready to reward players with real crypto!** 🎮💰
