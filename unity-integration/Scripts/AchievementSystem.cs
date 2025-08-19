using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using PiggyBankNFT;

namespace PiggyBankNFT
{
    [System.Serializable]
    public class Achievement
    {
        [Header("Achievement Info")]
        public string id;
        public string displayName;
        public string description;
        public Sprite icon;
        
        [Header("Rewards")]
        public decimal ethReward;
        public int experiencePoints;
        public string[] itemRewards;
        
        [Header("Progress")]
        public bool isUnlocked;
        public DateTime unlockDate;
        public int progressRequired;
        public int currentProgress;
        
        [Header("UI")]
        public Color rarityColor = Color.white;
        public AudioClip unlockSound;
        public ParticleSystem unlockEffect;
    }
    
    public class AchievementSystem : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private PiggyBankManager piggyBankManager;
        [SerializeField] private AchievementPopup achievementPopup;
        [SerializeField] private Transform achievementContainer;
        [SerializeField] private GameObject achievementPrefab;
        
        [Header("Achievements")]
        [SerializeField] private List<Achievement> achievements = new List<Achievement>();
        
        [Header("Settings")]
        [SerializeField] private bool autoSaveProgress = true;
        [SerializeField] private float popupDisplayTime = 3f;
        [SerializeField] private bool showUnlockEffects = true;
        
        // Events
        public event Action<Achievement> OnAchievementUnlocked;
        public event Action<Achievement, int> OnProgressUpdated;
        
        // Private fields
        private Dictionary<string, Achievement> achievementLookup;
        private List<Achievement> unlockedAchievements = new List<Achievement>();
        
        void Start()
        {
            InitializeAchievements();
            LoadProgress();
            
            // Subscribe to events
            if (piggyBankManager != null)
            {
                piggyBankManager.OnRewardDeposited += OnRewardDeposited;
            }
        }
        
        private void InitializeAchievements()
        {
            achievementLookup = new Dictionary<string, Achievement>();
            
            foreach (var achievement in achievements)
            {
                achievementLookup[achievement.id] = achievement;
                
                // Set default values
                if (achievement.rarityColor == Color.white)
                {
                    achievement.rarityColor = GetRarityColor(achievement.ethReward);
                }
            }
            
            Debug.Log($"Initialized {achievements.Count} achievements");
        }
        
        private Color GetRarityColor(decimal ethReward)
        {
            if (ethReward >= 0.1m) return Color.red;        // Legendary
            if (ethReward >= 0.05m) return Color.magenta;   // Epic
            if (ethReward >= 0.01m) return Color.blue;      // Rare
            if (ethReward >= 0.001m) return Color.green;    // Uncommon
            return Color.white;                              // Common
        }
        
        public void UnlockAchievement(string achievementId)
        {
            if (achievementLookup.TryGetValue(achievementId, out Achievement achievement))
            {
                UnlockAchievement(achievement);
            }
            else
            {
                Debug.LogWarning($"Achievement with ID '{achievementId}' not found");
            }
        }
        
        public void UnlockAchievement(Achievement achievement)
        {
            if (achievement.isUnlocked)
            {
                Debug.Log($"Achievement '{achievement.displayName}' is already unlocked");
                return;
            }
            
            try
            {
                // Mark as unlocked
                achievement.isUnlocked = true;
                achievement.unlockDate = DateTime.Now;
                unlockedAchievements.Add(achievement);
                
                // Deposit reward to PiggyBank NFT
                if (piggyBankManager != null && achievement.ethReward > 0)
                {
                    piggyBankManager.DepositReward(achievement.ethReward, achievement.displayName);
                }
                
                // Show unlock effects
                if (showUnlockEffects)
                {
                    ShowUnlockEffects(achievement);
                }
                
                // Show popup
                if (achievementPopup != null)
                {
                    achievementPopup.ShowAchievement(achievement);
                }
                
                // Trigger events
                OnAchievementUnlocked?.Invoke(achievement);
                
                // Save progress
                if (autoSaveProgress)
                {
                    SaveProgress();
                }
                
                Debug.Log($"Achievement unlocked: {achievement.displayName} (+{achievement.ethReward} ETH)");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to unlock achievement '{achievement.displayName}': {e.Message}");
            }
        }
        
        public void UpdateProgress(string achievementId, int progress)
        {
            if (achievementLookup.TryGetValue(achievementId, out Achievement achievement))
            {
                UpdateProgress(achievement, progress);
            }
        }
        
        public void UpdateProgress(Achievement achievement, int progress)
        {
            if (achievement.isUnlocked) return;
            
            achievement.currentProgress = Mathf.Clamp(progress, 0, achievement.progressRequired);
            
            // Check if achievement should be unlocked
            if (achievement.currentProgress >= achievement.progressRequired)
            {
                UnlockAchievement(achievement);
            }
            else
            {
                OnProgressUpdated?.Invoke(achievement, achievement.currentProgress);
            }
        }
        
        public void AddProgress(string achievementId, int progressToAdd)
        {
            if (achievementLookup.TryGetValue(achievementId, out Achievement achievement))
            {
                AddProgress(achievement, progressToAdd);
            }
        }
        
        public void AddProgress(Achievement achievement, int progressToAdd)
        {
            if (achievement.isUnlocked) return;
            
            int newProgress = achievement.currentProgress + progressToAdd;
            UpdateProgress(achievement, newProgress);
        }
        
        public void ResetProgress(string achievementId)
        {
            if (achievementLookup.TryGetValue(achievementId, out Achievement achievement))
            {
                ResetProgress(achievement);
            }
        }
        
        public void ResetProgress(Achievement achievement)
        {
            achievement.isUnlocked = false;
            achievement.currentProgress = 0;
            achievement.unlockDate = default(DateTime);
            
            if (unlockedAchievements.Contains(achievement))
            {
                unlockedAchievements.Remove(achievement);
            }
            
            Debug.Log($"Reset progress for achievement: {achievement.displayName}");
        }
        
        public void ResetAllProgress()
        {
            foreach (var achievement in achievements)
            {
                ResetProgress(achievement);
            }
            
            unlockedAchievements.Clear();
            SaveProgress();
            Debug.Log("Reset all achievement progress");
        }
        
        private void ShowUnlockEffects(Achievement achievement)
        {
            // Play unlock sound
            if (achievement.unlockSound != null)
            {
                AudioSource.PlayClipAtPoint(achievement.unlockSound, Camera.main.transform.position);
            }
            
            // Play particle effect
            if (achievement.unlockEffect != null)
            {
                var effect = Instantiate(achievement.unlockEffect, Camera.main.transform.position, Quaternion.identity);
                Destroy(effect.gameObject, effect.main.duration);
            }
            
            // Screen flash effect
            StartCoroutine(ScreenFlashEffect(achievement.rarityColor));
        }
        
        private IEnumerator ScreenFlashEffect(Color color)
        {
            // Create a temporary UI overlay for screen flash
            GameObject flashOverlay = new GameObject("FlashOverlay");
            flashOverlay.transform.SetParent(Canvas.main.transform, false);
            
            Image flashImage = flashOverlay.AddComponent<Image>();
            flashImage.color = new Color(color.r, color.g, color.b, 0.3f);
            flashImage.rectTransform.anchorMin = Vector2.zero;
            flashImage.rectTransform.anchorMax = Vector2.one;
            flashImage.rectTransform.sizeDelta = Vector2.zero;
            
            // Flash in
            float duration = 0.1f;
            float elapsed = 0f;
            
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float alpha = Mathf.Lerp(0f, 0.3f, elapsed / duration);
                flashImage.color = new Color(color.r, color.g, color.b, alpha);
                yield return null;
            }
            
            // Flash out
            elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float alpha = Mathf.Lerp(0.3f, 0f, elapsed / duration);
                flashImage.color = new Color(color.r, color.g, color.b, alpha);
                yield return null;
            }
            
            Destroy(flashOverlay);
        }
        
        public void RefreshUI()
        {
            if (achievementContainer == null || achievementPrefab == null) return;
            
            // Clear existing UI
            foreach (Transform child in achievementContainer)
            {
                Destroy(child.gameObject);
            }
            
            // Create achievement UI elements
            foreach (var achievement in achievements)
            {
                CreateAchievementUI(achievement);
            }
        }
        
        private void CreateAchievementUI(Achievement achievement)
        {
            GameObject achievementObj = Instantiate(achievementPrefab, achievementContainer);
            var achievementUI = achievementObj.GetComponent<AchievementUI>();
            
            if (achievementUI != null)
            {
                achievementUI.Setup(achievement, this);
            }
        }
        
        private void OnRewardDeposited(string reason, decimal amount)
        {
            Debug.Log($"Reward deposited to PiggyBank: {reason} (+{amount} ETH)");
        }
        
        // Progress persistence
        private void SaveProgress()
        {
            try
            {
                var progressData = new AchievementProgressData();
                
                foreach (var achievement in achievements)
                {
                    var progress = new AchievementProgress
                    {
                        id = achievement.id,
                        isUnlocked = achievement.isUnlocked,
                        unlockDate = achievement.unlockDate,
                        currentProgress = achievement.currentProgress
                    };
                    
                    progressData.achievements.Add(progress);
                }
                
                string json = JsonUtility.ToJson(progressData, true);
                PlayerPrefs.SetString("AchievementProgress", json);
                PlayerPrefs.Save();
                
                Debug.Log("Achievement progress saved");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save achievement progress: {e.Message}");
            }
        }
        
        private void LoadProgress()
        {
            try
            {
                if (PlayerPrefs.HasKey("AchievementProgress"))
                {
                    string json = PlayerPrefs.GetString("AchievementProgress");
                    var progressData = JsonUtility.FromJson<AchievementProgressData>(json);
                    
                    foreach (var progress in progressData.achievements)
                    {
                        if (achievementLookup.TryGetValue(progress.id, out Achievement achievement))
                        {
                            achievement.isUnlocked = progress.isUnlocked;
                            achievement.unlockDate = progress.unlockDate;
                            achievement.currentProgress = progress.currentProgress;
                            
                            if (achievement.isUnlocked)
                            {
                                unlockedAchievements.Add(achievement);
                            }
                        }
                    }
                    
                    Debug.Log("Achievement progress loaded");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load achievement progress: {e.Message}");
            }
        }
        
        // Public getters
        public List<Achievement> GetAllAchievements() => achievements;
        public List<Achievement> GetUnlockedAchievements() => unlockedAchievements;
        public int GetTotalAchievements() => achievements.Count;
        public int GetUnlockedCount() => unlockedAchievements.Count;
        public float GetCompletionPercentage() => (float)GetUnlockedCount() / GetTotalAchievements();
        
        public Achievement GetAchievement(string id)
        {
            achievementLookup.TryGetValue(id, out Achievement achievement);
            return achievement;
        }
        
        public bool IsAchievementUnlocked(string id)
        {
            var achievement = GetAchievement(id);
            return achievement?.isUnlocked ?? false;
        }
        
        void OnDestroy()
        {
            if (piggyBankManager != null)
            {
                piggyBankManager.OnRewardDeposited -= OnRewardDeposited;
            }
        }
    }
    
    // Data structures for persistence
    [System.Serializable]
    public class AchievementProgress
    {
        public string id;
        public bool isUnlocked;
        public DateTime unlockDate;
        public int currentProgress;
    }
    
    [System.Serializable]
    public class AchievementProgressData
    {
        public List<AchievementProgress> achievements = new List<AchievementProgress>();
    }
}
