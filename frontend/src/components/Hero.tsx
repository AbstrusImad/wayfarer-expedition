'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Compass, ShieldCheck } from 'lucide-react';
import { HeroCanvas } from './HeroCanvas';
import { CopyButton } from './primitives';
import { CONTRACT_ADDRESS, explorerAddr } from '@/lib/contract';
import { shortAddr } from '@/lib/format';

interface HeroProps {
  onEnter: () => void;
  expeditions: number;
  turns: number;
  active: number;
}

export function Hero({ onEnter, expeditions, turns, active }: HeroProps) {
  return (
    <section id="top" className="scanlines relative flex min-h-screen items-center overflow-hidden grid-bg">
      <HeroCanvas />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-base-900/20 via-transparent to-base" />

      <div className="relative mx-auto w-full max-w-6xl px-5 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <div className="mb-7 inline-flex items-center gap-2.5 rounded border border-amber/25 bg-amber/5 px-4 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-amber" />
            <span className="label-caps text-amber">AI consensus on GenLayer</span>
          </div>

          <h1 className="font-mono text-4xl font-bold uppercase leading-[1.05] tracking-tight text-fog sm:text-6xl">
            Survive by your
            <br />
            <span className="amber-text">wits</span>, not your luck.
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-fog-muted">
            Strand yourself in a hostile wilderness and stay alive one decision at a time. An AI warden
            judges the realism of every move under validator consensus, and your fate is sealed on-chain
            where no one can rewrite it.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button onClick={onEnter} className="btn-amber group flex items-center gap-2 rounded px-6 py-3">
              <Compass className="h-4 w-4" />
              Begin an expedition
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a href="#protocol" className="btn-ghost rounded px-6 py-3 text-sm text-fog-muted">
              How the warden judges
            </a>
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-x-10 gap-y-5">
            <Figure value={expeditions} label="Expeditions" />
            <span className="hidden h-10 w-px bg-fog/10 sm:block" />
            <Figure value={turns} label="Decisions judged" />
            <span className="hidden h-10 w-px bg-fog/10 sm:block" />
            <Figure value={active} label="Still alive" />
            <span className="hidden h-10 w-px bg-fog/10 sm:block" />
            <div>
              <p className="label-caps text-fog-faint">Contract</p>
              <a
                href={explorerAddr(CONTRACT_ADDRESS)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-2 font-mono text-sm text-fog transition-colors hover:text-amber"
              >
                {shortAddr(CONTRACT_ADDRESS)}
              </a>
              <span className="ml-2 inline-block align-middle">
                <CopyButton value={CONTRACT_ADDRESS} label="Copy contract address" />
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-mono text-4xl font-bold text-fog tnum">{value}</p>
      <p className="label-caps mt-1 text-fog-faint">{label}</p>
    </div>
  );
}
