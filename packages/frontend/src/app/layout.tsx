import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cursed Faction NFT Collection',
  description: 'AI-enhanced NFT collection featuring mystical warriors, sorceresses, and guardians from the cursed realm.',
  keywords: ['NFT', 'Cursed Faction', 'AI-enhanced', 'blockchain', 'collection'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}