import NFTGrid from '@/components/NFTGrid';
import { NFTMetadata } from '@/types/nft';
import '@/components/NFTGrid.css';

// Mock NFT data for testing
const mockNFTs: NFTMetadata[] = [
  {
    id: '1',
    name: 'Cursed Warrior #001',
    description: 'A legendary warrior from the depths of the cursed realm, wielding ancient power and bearing mystical runes.',
    image: 'https://via.placeholder.com/400x400/1a1a2e/ffffff?text=Cursed+Warrior+%23001',
    attributes: [
      { trait_type: 'Faction', value: 'Shadow' },
      { trait_type: 'Weapon', value: 'Runic Blade' },
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Power Level', value: 95 }
    ]
  },
  {
    id: '2', 
    name: 'Mystic Sorceress #047',
    description: 'Master of arcane arts with the ability to manipulate reality itself through forbidden spells.',
    image: 'https://via.placeholder.com/400x400/16213e/ffffff?text=Mystic+Sorceress+%23047',
    attributes: [
      { trait_type: 'Faction', value: 'Arcane' },
      { trait_type: 'Magic Type', value: 'Elemental' },
      { trait_type: 'Rarity', value: 'Epic' },
      { trait_type: 'Mana Pool', value: 88 }
    ]
  },
  {
    id: '3',
    name: 'Dark Assassin #213',
    description: 'Silent predator of the night, moving through shadows with unmatched stealth and deadly precision.',
    image: 'https://via.placeholder.com/400x400/0d1421/ffffff?text=Dark+Assassin+%23213',
    attributes: [
      { trait_type: 'Faction', value: 'Shadow' },
      { trait_type: 'Weapon', value: 'Twin Daggers' },
      { trait_type: 'Rarity', value: 'Rare' },
      { trait_type: 'Stealth', value: 92 }
    ]
  },
  {
    id: '4',
    name: 'Ancient Guardian #008',
    description: 'Protector of sacred grounds, this ancient being has watched over the realm for millennia.',
    image: 'https://via.placeholder.com/400x400/1e3a8a/ffffff?text=Ancient+Guardian+%23008',
    attributes: [
      { trait_type: 'Faction', value: 'Divine' },
      { trait_type: 'Weapon', value: 'Sacred Staff' },
      { trait_type: 'Rarity', value: 'Mythic' },
      { trait_type: 'Defense', value: 98 }
    ]
  },
  {
    id: '5',
    name: 'Flame Berserker #156',
    description: 'Warrior consumed by eternal flames, channeling pure rage and fire magic in battle.',
    image: 'https://via.placeholder.com/400x400/7c2d12/ffffff?text=Flame+Berserker+%23156',
    attributes: [
      { trait_type: 'Faction', value: 'Fire' },
      { trait_type: 'Weapon', value: 'Flame Axe' },
      { trait_type: 'Rarity', value: 'Epic' },
      { trait_type: 'Fury', value: 87 }
    ]
  },
  {
    id: '6',
    name: 'Frost Maiden #072',
    description: 'Beautiful yet deadly, she commands the power of ice and winter winds.',
    image: 'https://via.placeholder.com/400x400/0c4a6e/ffffff?text=Frost+Maiden+%23072',
    attributes: [
      { trait_type: 'Faction', value: 'Ice' },
      { trait_type: 'Magic Type', value: 'Frost' },
      { trait_type: 'Rarity', value: 'Rare' },
      { trait_type: 'Ice Control', value: 84 }
    ]
  }
];

export default function Home() {
  return (
    <main>
      <NFTGrid nfts={mockNFTs} autoAnalyze={false} />
    </main>
  );
}