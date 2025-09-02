import { CodemateAIService } from '../lib/codemate-ai';
import { NFTMetadata } from '../types/nft';

// Simple test suite for the Codemate AI service
describe('CodemateAIService', () => {
  let aiService: CodemateAIService;
  let mockNFT: NFTMetadata;

  beforeEach(() => {
    aiService = CodemateAIService.getInstance();
    mockNFT = {
      id: 'test-1',
      name: 'Test Warrior',
      description: 'A brave warrior from the test realm with magical abilities.',
      image: 'https://example.com/test-warrior.jpg',
      attributes: [
        { trait_type: 'Faction', value: 'Test' },
        { trait_type: 'Weapon', value: 'Test Sword' },
        { trait_type: 'Rarity', value: 'Common' }
      ]
    };
  });

  test('should generate fallback tags from NFT attributes', () => {
    const tags = (aiService as any).generateFallbackTags(mockNFT);
    
    expect(tags).toContain('test');
    expect(tags).toContain('warrior');
    expect(tags.length).toBeLessThanOrEqual(5);
  });

  test('should generate fallback summary from description', () => {
    const summary = (aiService as any).generateFallbackSummary(mockNFT);
    
    expect(summary).toBe(mockNFT.description);
  });

  test('should truncate long descriptions', () => {
    const longDescription = 'A'.repeat(200);
    const nftWithLongDesc = { ...mockNFT, description: longDescription };
    
    const summary = (aiService as any).generateFallbackSummary(nftWithLongDesc);
    
    expect(summary.length).toBeLessThanOrEqual(150);
    expect(summary.endsWith('...')).toBe(true);
  });

  test('should handle NFT without description', () => {
    const nftWithoutDesc = { ...mockNFT, description: '' };
    
    const summary = (aiService as any).generateFallbackSummary(nftWithoutDesc);
    
    expect(summary).toContain(mockNFT.name);
    expect(summary).toContain('Cursed Faction');
  });

  test('should cache analysis results', async () => {
    // Clear cache first
    aiService.clearCache();
    
    // First call should trigger API call (will fail in test, but should return fallback)
    const analysis1 = await aiService.analyzeNFT(mockNFT);
    
    // Second call should use cache
    const analysis2 = await aiService.analyzeNFT(mockNFT);
    
    expect(analysis1).toEqual(analysis2);
  });

  test('should handle API failures gracefully', async () => {
    const analysis = await aiService.analyzeNFT(mockNFT);
    
    // Should return fallback data when API fails
    expect(analysis.tags).toBeDefined();
    expect(analysis.summary).toBeDefined();
    expect(analysis.confidence).toBe(0); // Fallback confidence
  });
});