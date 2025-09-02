export interface NFTMetadata {
  id: string;
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
}

export interface AIAnalysis {
  tags: string[];
  summary: string;
  confidence: number;
}

export interface NFTWithAI extends NFTMetadata {
  aiAnalysis?: AIAnalysis;
  isAnalyzing?: boolean;
  analysisError?: string;
}

export interface CodemateAIResponse {
  tags?: string[];
  summary?: string;
  confidence?: number;
  error?: string;
}