import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-mono',
  display: 'swap',
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Wayfarer — On-Chain AI Survival Expeditions',
  description:
    'Wayfarer is a survival simulator on GenLayer. An AI warden judges every decision under validator consensus, and your fate is settled on-chain. How many days can you last?',
  openGraph: {
    title: 'Wayfarer — On-Chain AI Survival Expeditions',
    description:
      'Strand yourself in a hostile scenario and survive by your wits. An AI warden judges each decision under validator consensus on GenLayer.',
    type: 'website',
  },
  metadataBase: new URL('https://abstrusimad.github.io'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plexMono.variable} ${plexSans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
