'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LogOut, Wallet } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { WayfarerMark } from './Brand';
import { CopyButton, ExternalLinkChip } from './primitives';
import { CONTRACT_ADDRESS, FAUCET, explorerAddr } from '@/lib/contract';
import { shortAddr } from '@/lib/format';
import type { useWallet } from '@/hooks/useWallet';

type WalletHook = ReturnType<typeof useWallet>;

export function Header({ wallet }: { wallet: WalletHook }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-fog/10 bg-base-900/80 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#top" className="flex items-center gap-2.5">
          <WayfarerMark />
          <span className="font-mono text-lg font-semibold uppercase tracking-wide text-fog">Wayfarer</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#protocol" className="label-caps text-fog-muted transition-colors hover:text-amber">
            Protocol
          </a>
          <a href="#expeditions" className="label-caps text-fog-muted transition-colors hover:text-amber">
            Expeditions
          </a>
          <a href="#survivors" className="label-caps text-fog-muted transition-colors hover:text-amber">
            Survivors
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <span
            className={`hidden items-center gap-2 rounded border px-3 py-1.5 font-mono text-xs sm:inline-flex ${
              wallet.onCorrectChain ? 'border-amber/40 text-amber' : 'border-fog/15 text-fog-muted'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${wallet.onCorrectChain ? 'bg-amber animate-pulse-soft' : 'bg-fog-faint'}`} />
            BRADBURY
          </span>

          {wallet.address ? (
            <div className="relative" ref={ref}>
              <button onClick={() => setOpen((v) => !v)} className="btn-ghost flex items-center gap-2 rounded px-3 py-2 text-sm text-fog">
                <Wallet className="h-4 w-4 text-amber" />
                <span className="font-mono">{shortAddr(wallet.address)}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="panel absolute right-0 mt-2 w-72 rounded-lg p-4 shadow-panel"
                  >
                    <p className="label-caps text-fog-faint">Connected account</p>
                    <div className="mt-2 flex items-center justify-between gap-2 rounded bg-base-900/60 px-3 py-2">
                      <span className="truncate font-mono text-xs text-fog">{wallet.address}</span>
                      <CopyButton value={wallet.address} label="Copy address" />
                    </div>
                    {!wallet.onCorrectChain && (
                      <p className="mt-3 text-xs text-signal-peril">Wrong network. Switch to Bradbury to play.</p>
                    )}
                    <div className="mt-3 flex flex-col gap-2 text-xs">
                      <ExternalLinkChip href={FAUCET}>Claim test GEN</ExternalLinkChip>
                      <ExternalLinkChip href={explorerAddr(CONTRACT_ADDRESS)}>View contract</ExternalLinkChip>
                    </div>
                    <button
                      onClick={() => {
                        wallet.disconnect();
                        setOpen(false);
                      }}
                      className="btn-ghost mt-4 flex w-full items-center justify-center gap-2 rounded py-2 text-sm text-fog-muted"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Disconnect
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={wallet.connect} disabled={wallet.connecting} className="btn-amber flex items-center gap-2 rounded px-4 py-2 text-sm">
              <Wallet className="h-4 w-4" />
              {wallet.connecting ? 'Connecting' : 'Connect'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
