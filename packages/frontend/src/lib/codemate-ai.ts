import { CodemateAIResponse, NFTMetadata, AIAnalysis } from '@/types/nft';

// Codemate AI endpoint as specified in the original PR requirements
const CODEMATE_AI_ENDPOINT = 'https://app.codemate.ai/build/f5e69adb-33eb-40fa-8b8f-9fbb231ad482';

export class CodemateAIService {
  private static instance: CodemateAIService;
  private cache = new Map<string, AIAnalysis>();

  static getInstance(): CodemateAIService {
    if (!CodemateAIService.instance) {
      CodemateAIService.instance = new CodemateAIService();
    }
    return CodemateAIService.instance;
  }

  async analyzeNFT(nft: NFTMetadata): Promise<AIAnalysis> {
    const cacheKey = `${nft.id}-${nft.image}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Prepare data for AI analysis
      const analysisPayload = {
        id: nft.id,
        name: nft.name,
        description: nft.description,
        image: nft.image,
        attributes: nft.attributes || []
      };

      const response = await fetch(CODEMATE_AI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'nft_analysis',
          data: analysisPayload
        }),
      });

      let aiResult: CodemateAIResponse;
      
      if (!response.ok) {
        throw new Error(`AI service responded with status: ${response.status}`);
      }

      try {
        aiResult = await response.json();
      } catch (parseError) {
        throw new Error('Invalid response format from AI service');
      }

      // Process AI response
      const analysis: AIAnalysis = {
        tags: aiResult.tags || this.generateFallbackTags(nft),
        summary: aiResult.summary || this.generateFallbackSummary(nft),
        confidence: aiResult.confidence || 0.5
      };

      // Cache the result
      this.cache.set(cacheKey, analysis);
      
      return analysis;
    } catch (error) {
      console.warn('AI analysis failed, using fallback:', error);
      
      // Return fallback analysis as specified in requirements
      const fallbackAnalysis: AIAnalysis = {
        tags: this.generateFallbackTags(nft),
        summary: this.generateFallbackSummary(nft),
        confidence: 0
      };

      return fallbackAnalysis;
    }
  }

  private generateFallbackTags(nft: NFTMetadata): string[] {
    const tags: string[] = [];
    
    // Extract tags from attributes
    if (nft.attributes) {
      nft.attributes.forEach(attr => {
        if (typeof attr.value === 'string' && attr.value.length < 20) {
          tags.push(attr.value.toLowerCase());
        }
      });
    }

    // Extract tags from name
    if (nft.name) {
      const nameWords = nft.name.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      tags.push(...nameWords);
    }

    return Array.from(new Set(tags)).slice(0, 5); // Unique tags, max 5
  }

  private generateFallbackSummary(nft: NFTMetadata): string {
    // Use original description as fallback summary as per requirements
    if (nft.description && nft.description.trim()) {
      return nft.description.length > 150 
        ? nft.description.substring(0, 147) + '...'
        : nft.description;
    }
    
    return `${nft.name} - A unique NFT in the Cursed Faction collection.`;
  }

  // Method to clear cache if needed
  clearCache(): void {
    this.cache.clear();
  }
}