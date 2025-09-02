'use client';

import { NFTGrid } from '../components/NFTGrid';
import { NFTData } from '../services/codemateAI';

// Mock NFT data for demonstration
const mockNFTs: NFTData[] = [
  {
    id: '1',
    name: 'Cursed Avatar #001',
    description: 'A powerful warrior from the Gravemind Syndicate faction, wielding shadow powers and ancient runes. This rare avatar possesses unique abilities for parkour and stealth missions in the cursed city.',
    image: 'https://picsum.photos/400/400?random=1',
    tokenId: 1,
    owner: '0x1234567890123456789012345678901234567890',
  },
  {
    id: '2',
    name: 'Shadow Blade Artifact',
    description: 'An ancient weapon imbued with dark energy. Limited charges remaining.',
    image: 'https://picsum.photos/400/400?random=2',
    tokenId: 2,
    owner: '0x2345678901234567890123456789012345678901',
  },
  {
    id: '3',
    name: 'Neon Punk Gear #123',
    description: 'Cyberpunk-styled armor with reactive LED patterns that adapt to the environment. Perfect for night raids and urban exploration.',
    image: 'https://picsum.photos/400/400?random=3',
    tokenId: 3,
    owner: '0x3456789012345678901234567890123456789012',
  },
  {
    id: '4',
    name: 'Mystic Rune Stone',
    description: 'A rare collectible stone inscribed with ancient symbols. Grants temporary magical buffs when equipped.',
    image: 'https://picsum.photos/400/400?random=4',
    tokenId: 4,
    owner: '0x4567890123456789012345678901234567890123',
  },
  {
    id: '5',
    name: 'Elite Faction Commander',
    description: 'A legendary character with maximum stats and exclusive access to faction command abilities. Only 100 ever minted.',
    image: 'https://picsum.photos/400/400?random=5',
    tokenId: 5,
    owner: '0x5678901234567890123456789012345678901234',
  },
  {
    id: '6',
    name: 'Digital Skull Art',
    description: 'Abstract digital art featuring a stylized skull with glitch effects.',
    image: 'https://picsum.photos/400/400?random=6',
    tokenId: 6,
    owner: '0x6789012345678901234567890123456789012345',
  },
];

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', padding: '2rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '1rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            Cursed Faction NFT Collection
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: 'rgba(255,255,255,0.9)',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}>
            AI-Enhanced NFT Grid with Codemate Analysis
          </p>
        </header>
        
        <NFTGrid nfts={mockNFTs} />
      </div>
    </main>
  );
}