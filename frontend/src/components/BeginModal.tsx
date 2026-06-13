'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Compass, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Modal } from './Modal';
import { ExternalLinkChip } from './primitives';
import { useToast } from './Toast';
import type { useTransaction } from '@/hooks/useTransaction';
import { FAUCET, explorerTx, writeBegin } from '@/lib/contract';
import type { Scenario } from '@/lib/format';

export const FALLBACK_SCENARIOS: Scenario[] = [
  { key: 'open-sea', title: 'Adrift on the Open Sea', brief: 'Your vessel sank at dawn. You cling to a life raft in cold, open water with a few salvaged supplies and no land in sight.' },
  { key: 'andes', title: 'Stranded in the Andes', brief: 'A small plane went down in the high Andes. The air is thin, night temperatures plunge below freezing, and rescue is days away.' },
  { key: 'dunes', title: 'Lost in the Great Dunes', brief: 'Your expedition vehicle broke down in a vast desert. Water is scarce, the sun is merciless, and the dunes shift with the wind.' },
  { key: 'boreal', title: 'Alone in the Boreal Forest', brief: 'You are separated from your party deep in a cold northern forest. Wolves range nearby and the first snow has begun to fall.' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  scenarios: Scenario[];
  tx: ReturnType<typeof useTransaction>;
  canSubmit: boolean;
  onConnect: () => void;
}

export function BeginModal({ open, onClose, scenarios, tx, canSubmit, onConnect }: Props) {
  const toast = useToast();
  const list = scenarios.length ? scenarios : FALLBACK_SCENARIOS;
  const [picked, setPicked] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const busy = tx.state.phase === 'wallet' || tx.state.phase === 'submitted' || tx.state.phase === 'consensus';
  const done = tx.state.phase === 'confirmed';

  const reset = () => {
    setPicked(null);
    setConfirming(false);
    tx.reset();
  };
  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const submit = async () => {
    if (!picked) return;
    setConfirming(false);
    const id = toast.push({ kind: 'loading', message: 'Confirm the expedition in your wallet...' });
    const ok = await tx.run(async (client) => {
      const hash = await writeBegin(client, picked);
      toast.update(id, { kind: 'loading', message: 'Setting out on Bradbury...', hash });
      return hash;
    });
    if (ok) {
      toast.update(id, { kind: 'success', message: 'Expedition underway. Survive.', hash: tx.state.hash ?? undefined });
      setTimeout(close, 1200);
    } else {
      toast.update(id, { kind: 'error', message: tx.state.error ?? 'The expedition could not be started.' });
    }
  };

  return (
    <Modal open={open} onClose={close} title={done ? undefined : 'Begin an expedition'} dismissable={!busy}>
      {done ? (
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-signal-thrive" />
          <h3 className="mt-4 font-mono text-xl font-semibold uppercase tracking-wide text-fog">You are stranded</h3>
          <p className="mt-2 text-fog-muted">Day one begins now. Find your expedition on the board and make your first move.</p>
          <button onClick={close} className="btn-amber mt-6 rounded px-6 py-2.5 text-sm">
            To the field
          </button>
        </div>
      ) : busy ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Loader2 className="h-10 w-10 animate-spin-slow text-amber" />
          <p className="mt-4 text-fog">
            {tx.state.phase === 'wallet' ? 'Confirm in your wallet...' : 'Recording on Bradbury...'}
          </p>
          {tx.state.liveStatus && <p className="mt-2 font-mono text-xs text-fog-faint">status&nbsp;&middot;&nbsp;{tx.state.liveStatus}</p>}
          {tx.state.hash && (
            <a href={explorerTx(tx.state.hash)} target="_blank" rel="noopener noreferrer" className="mt-3 font-mono text-xs text-amber">
              View transaction
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-fog-muted">Choose where to test your survival. Each scenario punishes different mistakes.</p>
          <div className="grid grid-cols-1 gap-3">
            {list.map((s) => {
              const on = picked === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setPicked(s.key)}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    on ? 'border-amber/50 bg-amber/5' : 'border-fog/12 hover:border-fog/25'
                  }`}
                >
                  <p className={`font-mono text-sm font-semibold uppercase tracking-wide ${on ? 'text-amber' : 'text-fog'}`}>{s.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-fog-muted">{s.brief}</p>
                </button>
              );
            })}
          </div>

          {!confirming ? (
            <button
              onClick={() => (canSubmit ? picked && setConfirming(true) : onConnect())}
              disabled={canSubmit && !picked}
              className="btn-amber flex w-full items-center justify-center gap-2 rounded py-3.5"
            >
              <Compass className="h-4 w-4" />
              {canSubmit ? 'Set out' : 'Connect wallet to begin'}
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-amber/25 bg-amber/5 p-4">
              <p className="text-sm text-fog">This submits a transaction on Bradbury Testnet. Network fees apply (mostly refunded).</p>
              <p className="mt-1.5 text-xs text-fog-muted">
                Need test GEN? <ExternalLinkChip href={FAUCET}>Claim from the faucet</ExternalLinkChip>
              </p>
              <div className="mt-4 flex gap-3">
                <button onClick={() => setConfirming(false)} className="btn-ghost flex-1 rounded py-2.5 text-sm text-fog-muted">
                  Back
                </button>
                <button onClick={submit} className="btn-amber flex-1 rounded py-2.5 text-sm">
                  Confirm and set out
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </Modal>
  );
}
