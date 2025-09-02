import React from 'react';
import { NFTWithAI } from '@/types/nft';

interface NFTCardProps {
  nft: NFTWithAI;
  onAnalyze?: (nftId: string) => void;
}

export default function NFTCard({ nft, onAnalyze }: NFTCardProps) {
  const handleAnalyzeClick = () => {
    if (onAnalyze && !nft.isAnalyzing && !nft.aiAnalysis) {
      onAnalyze(nft.id);
    }
  };

  return (
    <div className="nft-card">
      <div className="nft-image-container">
        <img 
          src={nft.image} 
          alt={nft.name}
          className="nft-image"
          loading="lazy"
        />
        {nft.isAnalyzing && (
          <div className="analysis-overlay">
            <div className="spinner"></div>
            <span>Analyzing with AI...</span>
          </div>
        )}
      </div>
      
      <div className="nft-content">
        <h3 className="nft-name">{nft.name}</h3>
        
        {/* AI-generated tags */}
        {nft.aiAnalysis?.tags && nft.aiAnalysis.tags.length > 0 && (
          <div className="ai-tags">
            {nft.aiAnalysis.tags.map((tag, index) => (
              <span key={index} className="ai-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* AI-generated summary or original description */}
        <div className="nft-description">
          {nft.aiAnalysis?.summary ? (
            <div className="ai-summary">
              <p>{nft.aiAnalysis.summary}</p>
              {nft.aiAnalysis.confidence > 0 && (
                <div className="ai-confidence">
                  <span className="ai-badge">AI Enhanced</span>
                  <span className="confidence-score">
                    {Math.round(nft.aiAnalysis.confidence * 100)}% confidence
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="original-description">{nft.description}</p>
          )}
        </div>

        {/* Error state */}
        {nft.analysisError && (
          <div className="analysis-error">
            <span className="error-icon">⚠️</span>
            <span>AI analysis failed. Showing original content.</span>
          </div>
        )}

        {/* Analyze button */}
        {!nft.aiAnalysis && !nft.isAnalyzing && !nft.analysisError && (
          <button 
            onClick={handleAnalyzeClick}
            className="analyze-button"
            aria-label={`Analyze ${nft.name} with AI`}
          >
            🤖 Enhance with AI
          </button>
        )}

        {/* NFT attributes */}
        {nft.attributes && nft.attributes.length > 0 && (
          <div className="nft-attributes">
            <h4>Attributes</h4>
            <div className="attributes-grid">
              {nft.attributes.slice(0, 4).map((attr, index) => (
                <div key={index} className="attribute">
                  <span className="trait-type">{attr.trait_type}</span>
                  <span className="trait-value">{attr.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}