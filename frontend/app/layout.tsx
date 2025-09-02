import './globals.css'

export const metadata = {
  title: 'Cursed Faction NFT Collection',
  description: 'AI-powered NFT collection with advanced analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}