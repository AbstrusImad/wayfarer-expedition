'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Compass, Loader2, Radar, Users } from 'lucide-react';
import type { TxState } from '@/hooks/useTransaction';

const STAGES = [
  { key: 'submit', label: 'Decision logged to the field journal', icon: Compass },
  { key: 'leader', label: 'Lead warden assessing the move', icon: Radar },
  { key: 'validators', label: 'Validators re-running the judgment', icon: Users },
  { key: 'seal', label: 'Outcome sealed under consensus', icon: Check },
];

function stageIndex(status: string | null): number {
  if (!status) return 0;
  if (['ACCEPTED', 'FINALIZED'].includes(status)) return 3;
  if (['COMMITTING', 'REVEALING'].includes(status)) return 2;
  if (['PROPOSING'].includes(status)) return 1;
  return 0;
}

const ROTATING = new Set(['LEADER_TIMEOUT', 'VALIDATORS_TIMEOUT']);

export function ConsensusStage({ state }: { state: TxState }) {
  const status = state.liveStatus;
  const active = stageIndex(status);
  const rotating = status ? ROTATING.has(status) : false;
  const draft = state.draft;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full border border-amber/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-4 rounded-full border border-dashed border-amber/30"
          animate={{ rotate: -360 }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        />
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber/5">
          <Radar className="h-9 w-9 text-amber animate-pulse-soft" />
        </div>
      </div>

      <p className="label-caps text-amber">{rotating ? 'Rotating warden' : 'Warden deliberating'}</p>
      <h3 className="mt-2 font-mono text-xl font-semibold uppercase tracking-wide text-fog">Judging your move</h3>
      <p className="mt-2 max-w-sm text-sm text-fog-muted">
        An AI decision on Bradbury takes one to five minutes. The lead warden assesses your move, then
        independent validators re-run the same judgment until they agree.
      </p>

      <div className="mt-8 w-full max-w-sm space-y-3 text-left">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const done = i < active;
          const current = i === active;
          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 rounded border px-4 py-3 transition-colors ${
                current ? 'border-amber/40 bg-amber/5' : done ? 'border-fog/10 bg-base-900/40' : 'border-fog/5 opacity-50'
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                {done ? (
                  <Check className="h-4 w-4 text-signal-thrive" />
                ) : current ? (
                  <Loader2 className="h-4 w-4 animate-spin-slow text-amber" />
                ) : (
                  <Icon className="h-4 w-4 text-fog-faint" />
                )}
              </span>
              <span className={`font-mono text-xs ${current ? 'text-fog' : 'text-fog-muted'}`}>{s.label}</span>
            </div>
          );
        })}
      </div>

      {rotating && (
        <p className="mt-5 max-w-sm text-xs text-fog-faint">
          The network is rotating the lead warden and retrying. This is normal under load — your move is
          still being judged.
        </p>
      )}

      <AnimatePresence>
        {draft && typeof draft.delta === 'number' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-7 w-full max-w-sm rounded-lg border border-amber/25 bg-amber/5 p-5 text-left"
          >
            <p className="label-caps text-amber">Warden draft — sealing under consensus</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`font-mono text-4xl font-bold tnum ${draft.delta >= 0 ? 'text-signal-thrive' : 'text-signal-peril'}`}>
                {draft.delta >= 0 ? '+' : ''}
                {draft.delta}
              </span>
              <span className="text-sm text-fog-muted">vitality</span>
            </div>
            {draft.narrative && <p className="mt-2 text-sm italic text-fog-muted">&ldquo;{draft.narrative}&rdquo;</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {status && (
        <p className="mt-6 font-mono text-xs text-fog-faint">
          network status&nbsp;&middot;&nbsp;<span className="text-amber">{status}</span>
        </p>
      )}
    </div>
  );
}
