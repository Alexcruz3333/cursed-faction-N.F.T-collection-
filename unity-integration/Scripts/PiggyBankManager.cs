using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using System.Numerics;
using Nethereum.Web3;
using Nethereum.Contracts;
using Nethereum.Web3.Accounts;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Hex.HexTypes;

namespace PiggyBankNFT
{
    public class PiggyBankManager : MonoBehaviour
    {
        [Header("Contract Configuration")]
        [SerializeField] private string contractAddress = "0x0000000000000000000000000000000000000000";
        [SerializeField] private string rpcUrl = "https://mainnet.base.org";
        [SerializeField] private int chainId = 8453;
        [SerializeField] private bool testMode = true;
        
        [Header("UI References")]
        [SerializeField] private Text balanceText;
        [SerializeField] private Text goalText;
        [SerializeField] private Slider progressBar;
        [SerializeField] private Button connectWalletButton;
        [SerializeField] private Button depositButton;
        [SerializeField] private Button withdrawButton;
        [SerializeField] private Button setGoalButton;
        
        [Header("Settings")]
        [SerializeField] private decimal defaultSavingsGoal = 1.0m;
        [SerializeField] private int defaultTimeLockDays = 30;
        
        // Private fields
        private Web3 web3;
        private Contract contract;
        private Account account;
        private bool isWalletConnected = false;
        private decimal currentBalance = 0m;
        private decimal currentGoal = 0m;
        private DateTime? unlockTime = null;
        
        // Events
        public event Action<decimal> OnBalanceChanged;
        public event Action<decimal> OnGoalChanged;
        public event Action<bool> OnWalletConnectionChanged;
        public event Action<string, decimal> OnRewardDeposited;
        public event Action<string> OnError;
        
        // Contract ABI (simplified)
        private static readonly string ContractABI = @"[
            {""inputs"":[{""name"":""tokenId"",""type"":""uint256""}],""name"":""ethBalance"",""outputs"":[{""name"":"""",""type"":""uint256""}],""stateMutability"":""view"",""type"":""function""},
            {""inputs"":[{""name"":""tokenId"",""type"":""uint256""}],""name"":""savingsGoal"",""outputs"":[{""name"":"""",""type"":""uint256""}],""stateMutability"":""view"",""type"":""function""},
            {""inputs"":[{""name"":""tokenId"",""type"":""uint256""}],""name"":""unlockTime"",""outputs"":[{""name"":"""",""type"":""uint256""}],""stateMutability"":""view"",""type"":""function""},
            {""inputs"":[{""name"":""tokenId"",""type"":""uint256""}],""name"":""depositETH"",""outputs"":[],""stateMutability"":""payable"",""type"":""function""},
            {""inputs"":[{""name"":""tokenId"",""type"":""uint256""},{""name"":""amount"",""type"":""uint256""}],""name"":""withdrawETH"",""outputs"":[],""stateMutability"":""nonpayable"",""type"":""function""},
            {""inputs"":[{""name"":""tokenId"",""type"":""uint256""},{""name"":""goalWei"",""type"":""uint256""}],""name"":""setSavingsGoal"",""outputs"":[],""stateMutability"":""nonpayable"",""type"":""function""}
        ]";
        
        void Start()
        {
            Initialize();
            SetupUI();
        }
        
        public void Initialize()
        {
            try
            {
                if (testMode)
                {
                    InitializeTestMode();
                }
                else
                {
                    InitializeWeb3();
                }
                
                Debug.Log("PiggyBank NFT Manager initialized successfully");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to initialize PiggyBank Manager: {e.Message}");
                OnError?.Invoke($"Initialization failed: {e.Message}");
            }
        }
        
        private void InitializeTestMode()
        {
            Debug.Log("Initializing in TEST MODE");
            currentBalance = 0.5m;
            currentGoal = defaultSavingsGoal;
            unlockTime = DateTime.Now.AddDays(defaultTimeLockDays);
            
            // Simulate periodic balance updates
            StartCoroutine(SimulateBalanceUpdates());
        }
        
        private void InitializeWeb3()
        {
            try
            {
                web3 = new Web3(rpcUrl);
                contract = web3.Eth.GetContract(ContractABI, contractAddress);
                
                Debug.Log($"Web3 initialized with RPC: {rpcUrl}");
                Debug.Log($"Contract initialized at: {contractAddress}");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to initialize Web3: {e.Message}");
                throw;
            }
        }
        
        private void SetupUI()
        {
            if (connectWalletButton != null)
                connectWalletButton.onClick.AddListener(ConnectWallet);
                
            if (depositButton != null)
                depositButton.onClick.AddListener(ShowDepositDialog);
                
            if (withdrawButton != null)
                withdrawButton.onClick.AddListener(ShowWithdrawDialog);
                
            if (setGoalButton != null)
                setGoalButton.onClick.AddListener(ShowSetGoalDialog);
                
            UpdateUI();
        }
        
        public async void ConnectWallet()
        {
            try
            {
                if (testMode)
                {
                    // Simulate wallet connection in test mode
                    await SimulateWalletConnection();
                }
                else
                {
                    // Real wallet connection logic would go here
                    // This would integrate with MetaMask, WalletConnect, etc.
                    Debug.Log("Wallet connection not implemented in this demo");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Wallet connection failed: {e.Message}");
                OnError?.Invoke($"Wallet connection failed: {e.Message}");
            }
        }
        
        private async System.Threading.Tasks.Task SimulateWalletConnection()
        {
            Debug.Log("Simulating wallet connection...");
            
            // Simulate connection delay
            await System.Threading.Tasks.Task.Delay(1000);
            
            isWalletConnected = true;
            OnWalletConnectionChanged?.Invoke(true);
            
            // Load player's PiggyBank data
            await LoadPiggyBankData();
            
            Debug.Log("Wallet connected successfully (test mode)");
        }
        
        private async System.Threading.Tasks.Task LoadPiggyBankData()
        {
            try
            {
                if (testMode)
                {
                    // Use mock data
                    currentBalance = MockPiggyBankData.MockBalance;
                    currentGoal = MockPiggyBankData.MockGoal;
                    unlockTime = MockPiggyBankData.MockUnlockTime;
                }
                else
                {
                    // Load real data from blockchain
                    await LoadBalanceFromContract();
                    await LoadGoalFromContract();
                    await LoadUnlockTimeFromContract();
                }
                
                UpdateUI();
                OnBalanceChanged?.Invoke(currentBalance);
                OnGoalChanged?.Invoke(currentGoal);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load PiggyBank data: {e.Message}");
                OnError?.Invoke($"Failed to load data: {e.Message}");
            }
        }
        
        private async System.Threading.Tasks.Task LoadBalanceFromContract()
        {
            try
            {
                var function = contract.GetFunction("ethBalance");
                var tokenId = new BigInteger(1); // Assuming player owns token ID 1
                
                var result = await function.CallAsync<BigInteger>(tokenId);
                currentBalance = Nethereum.Util.UnitConversion.Convert.FromWei(result);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load balance: {e.Message}");
                throw;
            }
        }
        
        private async System.Threading.Tasks.Task LoadGoalFromContract()
        {
            try
            {
                var function = contract.GetFunction("savingsGoal");
                var tokenId = new BigInteger(1);
                
                var result = await function.CallAsync<BigInteger>(tokenId);
                currentGoal = Nethereum.Util.UnitConversion.Convert.FromWei(result);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load goal: {e.Message}");
                throw;
            }
        }
        
        private async System.Threading.Tasks.Task LoadUnlockTimeFromContract()
        {
            try
            {
                var function = contract.GetFunction("unlockTime");
                var tokenId = new BigInteger(1);
                
                var result = await function.CallAsync<BigInteger>(tokenId);
                if (result > 0)
                {
                    unlockTime = DateTimeOffset.FromUnixTimeSeconds((long)result).DateTime;
                }
                else
                {
                    unlockTime = null;
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load unlock time: {e.Message}");
                throw;
            }
        }
        
        public async void DepositReward(decimal amount, string reason)
        {
            try
            {
                if (testMode)
                {
                    // Simulate deposit in test mode
                    await SimulateDeposit(amount, reason);
                }
                else
                {
                    // Real deposit logic would go here
                    await DepositToContract(amount);
                }
                
                OnRewardDeposited?.Invoke(reason, amount);
                Debug.Log($"Deposited {amount} ETH for: {reason}");
            }
            catch (Exception e)
            {
                Debug.LogError($"Deposit failed: {e.Message}");
                OnError?.Invoke($"Deposit failed: {e.Message}");
            }
        }
        
        private async System.Threading.Tasks.Task SimulateDeposit(decimal amount, string reason)
        {
            Debug.Log($"Simulating deposit of {amount} ETH for: {reason}");
            
            // Simulate network delay
            await System.Threading.Tasks.Task.Delay(500);
            
            currentBalance += amount;
            UpdateUI();
            OnBalanceChanged?.Invoke(currentBalance);
            
            // Show achievement popup
            ShowAchievementPopup(reason, amount);
        }
        
        private async System.Threading.Tasks.Task DepositToContract(decimal amount)
        {
            try
            {
                var function = contract.GetFunction("depositETH");
                var tokenId = new BigInteger(1);
                var amountWei = Nethereum.Util.UnitConversion.Convert.ToWei(amount);
                
                var gas = await function.EstimateGasAsync(tokenId);
                var gasPrice = await web3.Eth.GasPrice.SendRequestAsync();
                
                var transaction = await function.SendTransactionAsync(
                    from: account.Address,
                    gas: gas,
                    gasPrice: gasPrice,
                    value: amountWei,
                    functionInput: tokenId
                );
                
                Debug.Log($"Deposit transaction sent: {transaction}");
                
                // Wait for transaction confirmation
                var receipt = await web3.Eth.TransactionReceipt.SendRequestAsync(transaction);
                Debug.Log($"Deposit confirmed in block: {receipt.BlockNumber}");
                
                // Reload balance
                await LoadBalanceFromContract();
            }
            catch (Exception e)
            {
                Debug.LogError($"Contract deposit failed: {e.Message}");
                throw;
            }
        }
        
        public async void Withdraw(decimal amount)
        {
            try
            {
                if (!CanWithdraw())
                {
                    OnError?.Invoke("Cannot withdraw: time lock active or insufficient balance");
                    return;
                }
                
                if (amount > currentBalance)
                {
                    OnError?.Invoke("Insufficient balance");
                    return;
                }
                
                if (testMode)
                {
                    await SimulateWithdraw(amount);
                }
                else
                {
                    await WithdrawFromContract(amount);
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Withdrawal failed: {e.Message}");
                OnError?.Invoke($"Withdrawal failed: {e.Message}");
            }
        }
        
        private async System.Threading.Tasks.Task SimulateWithdraw(decimal amount)
        {
            Debug.Log($"Simulating withdrawal of {amount} ETH");
            
            await System.Threading.Tasks.Task.Delay(500);
            
            currentBalance -= amount;
            UpdateUI();
            OnBalanceChanged?.Invoke(currentBalance);
            
            Debug.Log($"Withdrew {amount} ETH. New balance: {currentBalance} ETH");
        }
        
        private async System.Threading.Tasks.Task WithdrawFromContract(decimal amount)
        {
            try
            {
                var function = contract.GetFunction("withdrawETH");
                var tokenId = new BigInteger(1);
                var amountWei = Nethereum.Util.UnitConversion.Convert.ToWei(amount);
                
                var gas = await function.EstimateGasAsync(tokenId, amountWei);
                var gasPrice = await web3.Eth.GasPrice.SendRequestAsync();
                
                var transaction = await function.SendTransactionAsync(
                    from: account.Address,
                    gas: gas,
                    gasPrice: gasPrice,
                    functionInput: new object[] { tokenId, amountWei }
                );
                
                Debug.Log($"Withdrawal transaction sent: {transaction}");
                
                // Wait for confirmation
                var receipt = await web3.Eth.TransactionReceipt.SendRequestAsync(transaction);
                Debug.Log($"Withdrawal confirmed in block: {receipt.BlockNumber}");
                
                // Reload balance
                await LoadBalanceFromContract();
            }
            catch (Exception e)
            {
                Debug.LogError($"Contract withdrawal failed: {e.Message}");
                throw;
            }
        }
        
        public async void SetSavingsGoal(decimal goal)
        {
            try
            {
                if (testMode)
                {
                    currentGoal = goal;
                    UpdateUI();
                    OnGoalChanged?.Invoke(currentGoal);
                    Debug.Log($"Savings goal set to: {goal} ETH");
                }
                else
                {
                    await SetGoalOnContract(goal);
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to set goal: {e.Message}");
                OnError?.Invoke($"Failed to set goal: {e.Message}");
            }
        }
        
        private async System.Threading.Tasks.Task SetGoalOnContract(decimal goal)
        {
            try
            {
                var function = contract.GetFunction("setSavingsGoal");
                var tokenId = new BigInteger(1);
                var goalWei = Nethereum.Util.UnitConversion.Convert.ToWei(goal);
                
                var gas = await function.EstimateGasAsync(tokenId, goalWei);
                var gasPrice = await web3.Eth.GasPrice.SendRequestAsync();
                
                var transaction = await function.SendTransactionAsync(
                    from: account.Address,
                    gas: gas,
                    gasPrice: gasPrice,
                    functionInput: new object[] { tokenId, goalWei }
                );
                
                Debug.Log($"Set goal transaction sent: {transaction}");
                
                // Wait for confirmation
                var receipt = await web3.Eth.TransactionReceipt.SendRequestAsync(transaction);
                Debug.Log($"Goal set confirmed in block: {receipt.BlockNumber}");
                
                // Reload goal
                await LoadGoalFromContract();
            }
            catch (Exception e)
            {
                Debug.LogError($"Contract set goal failed: {e.Message}");
                throw;
            }
        }
        
        public bool CanWithdraw()
        {
            if (unlockTime.HasValue && DateTime.Now < unlockTime.Value)
                return false;
                
            return currentBalance > 0;
        }
        
        public decimal GetCurrentBalance() => currentBalance;
        public decimal GetSavingsGoal() => currentGoal;
        public DateTime? GetUnlockTime() => unlockTime;
        
        public float GetProgressToGoal()
        {
            if (currentGoal <= 0) return 0f;
            return Mathf.Clamp01((float)(currentBalance / currentGoal));
        }
        
        private void UpdateUI()
        {
            if (balanceText != null)
                balanceText.text = $"{currentBalance:F4} ETH";
                
            if (goalText != null)
                goalText.text = currentGoal > 0 ? $"{currentGoal:F4} ETH" : "Not set";
                
            if (progressBar != null)
                progressBar.value = GetProgressToGoal();
                
            if (withdrawButton != null)
                withdrawButton.interactable = CanWithdraw();
                
            if (connectWalletButton != null)
                connectWalletButton.interactable = !isWalletConnected;
        }
        
        private void ShowDepositDialog()
        {
            // This would show a deposit dialog UI
            Debug.Log("Show deposit dialog - not implemented in this demo");
        }
        
        private void ShowWithdrawDialog()
        {
            // This would show a withdrawal dialog UI
            Debug.Log("Show withdrawal dialog - not implemented in this demo");
        }
        
        private void ShowSetGoalDialog()
        {
            // This would show a set goal dialog UI
            Debug.Log("Show set goal dialog - not implemented in this demo");
        }
        
        private void ShowAchievementPopup(string reason, decimal amount)
        {
            // This would show an achievement popup
            Debug.Log($"Achievement unlocked: {reason} (+{amount} ETH)");
        }
        
        private IEnumerator SimulateBalanceUpdates()
        {
            while (testMode)
            {
                yield return new WaitForSeconds(30f); // Update every 30 seconds
                
                // Simulate small balance changes
                if (UnityEngine.Random.Range(0f, 1f) < 0.3f) // 30% chance
                {
                    var change = UnityEngine.Random.Range(-0.001f, 0.002f);
                    currentBalance += (decimal)change;
                    currentBalance = Math.Max(0, currentBalance);
                    
                    UpdateUI();
                    OnBalanceChanged?.Invoke(currentBalance);
                    
                    Debug.Log($"Simulated balance change: {change:F4} ETH. New balance: {currentBalance:F4} ETH");
                }
            }
        }
        
        void OnDestroy()
        {
            // Cleanup
            if (web3 != null)
            {
                web3.Dispose();
            }
        }
    }
}
