'use client';

import { motion } from 'framer-motion';
import { Compass, ScrollText, Stamp, Users } from 'lucide-react';

const STEPS = [
  {
    n: '01',
    title: 'Pick a scenario',
    body: 'Choose a hostile setting and begin at full vitality on day one. Starting an expedition is deterministic and instant.',
    icon: Compass,
  },
  {
    n: '02',
    title: 'Declare your move',
    body: 'Write a single survival decision in plain language. It is treated as untrusted input, never as an instruction to the warden.',
    icon: ScrollText,
  },
  {
    n: '03',
    title: 'The warden re-runs it',
    body: 'An LLM warden rates the realism of your move; every validator independently re-runs the same judgment until the vitality delta agrees.',
    icon: Users,
  },
  {
    n: '04',
    title: 'Your fate is sealed',
    body: 'Consensus settles the outcome on-chain. A deterministic backstop clamps vitality, advances the day, and ends the run at zero.',
    icon: Stamp,
  },
];

export function HowItWorks() {
  return (
    <section id="protocol" className="relative mx-auto max-w-6xl px-5 py-28">
      <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label-caps text-amber">// survival protocol</p>
          <h2 className="mt-3 max-w-xl font-mono text-3xl font-bold uppercase leading-tight tracking-tight text-fog sm:text-4xl">
            No hidden dice. Only consensus.
          </h2>
        </div>
        <p className="max-w-sm text-fog-muted">
          The contract is the backend. There is no game server deciding outcomes in private — the
          warden&apos;s judgment runs under validator consensus and the state transition is public.
        </p>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-amber/50 via-fog/15 to-transparent md:block" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded border border-amber/35 bg-base-900">
                  <span className="font-mono text-sm font-bold text-amber tnum">{s.n}</span>
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-amber" />
                  <h3 className="font-mono text-base font-semibold uppercase tracking-wide text-fog">{s.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-fog-muted">{s.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
