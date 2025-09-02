'use client';

import React, { useState, useEffect } from 'react';
import NFTCard from './NFTCard';
import { NFTMetadata, NFTWithAI } from '@/types/nft';
import { CodemateAIService } from '@/lib/codemate-ai';

interface NFTGridProps {
  nfts: NFTMetadata[];
  autoAnalyze?: boolean;
  className?: string;
}

export default function NFTGrid({ nfts, autoAnalyze = false, className = '' }: NFTGridProps) {
  const [nftsWithAI, setNftsWithAI] = useState<NFTWithAI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const aiService = CodemateAIService.getInstance();

  // Initialize NFTs with AI data structure
  useEffect(() => {
    const initialNfts: NFTWithAI[] = nfts.map(nft => ({
      ...nft,
      isAnalyzing: false,
    }));
    setNftsWithAI(initialNfts);
    setIsLoading(false);

    // Auto-analyze if enabled
    if (autoAnalyze && nfts.length > 0) {
      analyzeAllNFTs(initialNfts);
    }
  }, [nfts, autoAnalyze]);

  const analyzeNFT = async (nftId: string) => {
    setNftsWithAI(prev => prev.map(nft => 
      nft.id === nftId 
        ? { ...nft, isAnalyzing: true, analysisError: undefined }
        : nft
    ));

    try {
      const nft = nftsWithAI.find(n => n.id === nftId);
      if (!nft) return;

      const aiAnalysis = await aiService.analyzeNFT(nft);
      
      setNftsWithAI(prev => prev.map(n => 
        n.id === nftId 
          ? { ...n, isAnalyzing: false, aiAnalysis }
          : n
      ));
    } catch (error) {
      console.error('Failed to analyze NFT:', error);
      setNftsWithAI(prev => prev.map(n => 
        n.id === nftId 
          ? { 
              ...n, 
              isAnalyzing: false, 
              analysisError: 'Analysis failed. Please try again.' 
            }
          : n
      ));
    }
  };

  const analyzeAllNFTs = async (nftsToAnalyze: NFTWithAI[] = nftsWithAI) => {
    // Analyze NFTs in batches to avoid overwhelming the API
    const batchSize = 3;
    const batches = [];
    
    for (let i = 0; i < nftsToAnalyze.length; i += batchSize) {
      batches.push(nftsToAnalyze.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await Promise.all(
        batch.map(nft => analyzeNFT(nft.id))
      );
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const handleBulkAnalyze = () => {
    const unanalyzedNfts = nftsWithAI.filter(nft => !nft.aiAnalysis && !nft.isAnalyzing);
    if (unanalyzedNfts.length > 0) {
      analyzeAllNFTs(unanalyzedNfts);
    }
  };

  const getAnalysisStats = () => {
    const analyzed = nftsWithAI.filter(nft => nft.aiAnalysis).length;
    const analyzing = nftsWithAI.filter(nft => nft.isAnalyzing).length;
    const total = nftsWithAI.length;
    
    return { analyzed, analyzing, total };
  };

  const stats = getAnalysisStats();

  if (isLoading) {
    return (
      <div className="nft-grid-loading">
        <div className="loading-spinner"></div>
        <p>Loading NFT collection...</p>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="nft-grid-empty">
        <h3>No NFTs found</h3>
        <p>This collection appears to be empty.</p>
      </div>
    );
  }

  return (
    <div className={`nft-grid-container ${className}`}>
      {/* Header with controls */}
      <div className="nft-grid-header">
        <div className="collection-info">
          <h2>Cursed Faction NFT Collection</h2>
          <p>{nfts.length} items</p>
        </div>
        
        <div className="ai-controls">
          <div className="analysis-stats">
            <span className="stat">
              {stats.analyzed} of {stats.total} enhanced with AI
            </span>
            {stats.analyzing > 0 && (
              <span className="analyzing-count">
                ({stats.analyzing} analyzing...)
              </span>
            )}
          </div>
          
          {stats.analyzed < stats.total && (
            <button 
              onClick={handleBulkAnalyze}
              className="bulk-analyze-button"
              disabled={stats.analyzing > 0}
            >
              🤖 Enhance All with AI
            </button>
          )}
        </div>
      </div>

      {/* NFT Grid */}
      <div className="nft-grid">
        {nftsWithAI.map((nft) => (
          <NFTCard 
            key={nft.id} 
            nft={nft} 
            onAnalyze={analyzeNFT}
          />
        ))}
      </div>

      {/* Footer info */}
      <div className="nft-grid-footer">
        <p className="ai-disclaimer">
          AI enhancements powered by Codemate AI. 
          Fallback content shown when AI analysis is unavailable.
        </p>
      </div>
    </div>
  );
}