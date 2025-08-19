"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, baseGoerli } from 'wagmi/chains';
import '@rainbow-me/rainbowkit/styles.css';

const inter = Inter({ subsets: ["latin"] });

const { wallets } = getDefaultWallets({
  appName: 'PiggyBank NFT',
  projectId: 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [base, baseGoerli],
});

const config = createConfig({
  chains: [base, baseGoerli],
  transports: {
    [base.id]: http(),
    [baseGoerli.id]: http(),
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WagmiProvider config={config}>
          <RainbowKitProvider chains={config.chains} wallets={wallets}>
            {children}
          </RainbowKitProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
