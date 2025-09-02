'use client';

import React, { useState, useEffect } from 'react';
import { NFTData, AIAnalysisResult, CodemateAIService } from '../services/codemateAI';
import './NFTGrid.css';

interface NFTCardProps {
  nft: NFTData;
  aiService: CodemateAIService;
}

interface NFTGridProps {
  nfts: NFTData[];
  className?: string;
}

// Individual NFT Card component
const NFTCard: React.FC<NFTCardProps> = ({ nft, aiService }) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const analyzeNFT = async () => {
      try {
        setIsLoading(true);
        const analysis = await aiService.analyzeNFT(nft);
        setAiAnalysis(analysis);
      } catch (error) {
        console.error('Failed to analyze NFT:', error);
        // Set fallback analysis
        setAiAnalysis({
          tags: [],
          summary: nft.description,
          confidence: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    analyzeNFT();
  }, [nft, aiService]);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="nft-card" role="article" aria-label={`NFT: ${nft.name}`}>
      <div className="nft-card-image-container">
        {!imageError ? (
          <img
            src={nft.image}
            alt={nft.name}
            className="nft-card-image"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="nft-card-image-placeholder" aria-hidden="true">
            <span>Image not available</span>
          </div>
        )}
      </div>
      
      <div className="nft-card-content">
        <h3 className="nft-card-title">{nft.name}</h3>
        <p className="nft-card-token-id">Token ID: {nft.tokenId}</p>
        
        {/* AI-generated tags */}
        {aiAnalysis && aiAnalysis.tags.length > 0 && (
          <div className="nft-card-tags" role="list" aria-label="AI-generated tags">
            {aiAnalysis.tags.map((tag, index) => (
              <span 
                key={index} 
                className="nft-tag-badge"
                role="listitem"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* AI-generated summary */}
        <div className="nft-card-summary">
          {isLoading ? (
            <div className="nft-card-loading" aria-label="Analyzing NFT content">
              <span className="loading-spinner"></span>
              <span>AI analyzing...</span>
            </div>
          ) : (
            <div>
              <h4 className="nft-card-summary-title">
                {aiAnalysis?.confidence && aiAnalysis.confidence > 0 ? 'AI Summary:' : 'Description:'}
              </h4>
              <p className="nft-card-summary-text">
                {aiAnalysis?.summary || nft.description}
              </p>
              {aiAnalysis?.confidence && aiAnalysis.confidence > 0 && (
                <span className="nft-card-confidence" aria-label={`AI confidence: ${Math.round(aiAnalysis.confidence * 100)}%`}>
                  AI Confidence: {Math.round(aiAnalysis.confidence * 100)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main NFTGrid component
export const NFTGrid: React.FC<NFTGridProps> = ({ nfts, className = '' }) => {
  const [aiService] = useState(() => new CodemateAIService());

  if (!nfts || nfts.length === 0) {
    return (
      <div className={`nft-grid-empty ${className}`} role="status" aria-live="polite">
        <p>No NFTs to display</p>
      </div>
    );
  }

  return (
    <div 
      className={`nft-grid ${className}`} 
      role="main" 
      aria-label={`NFT grid displaying ${nfts.length} NFTs`}
    >
      <div className="nft-grid-container">
        {nfts.map((nft) => (
          <NFTCard 
            key={`${nft.id}-${nft.tokenId}`} 
            nft={nft} 
            aiService={aiService}
          />
        ))}
      </div>
    </div>
  );
};

export default NFTGrid;