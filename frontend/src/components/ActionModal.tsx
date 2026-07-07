'use client';

import { motion as fm } from 'framer-motion';
import { Heart, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Modal } from './Modal';
import { ConsensusStage } from './ConsensusStage';
import { ExternalLinkChip } from './primitives';
import { useToast } from './Toast';
import type { useTransaction } from '@/hooks/useTransaction';
import { FAUCET, writeAction } from '@/lib/contract';
import { vitalityColor, type Run } from '@/lib/format';

const MIN_ACTION = 12;
const MAX_ACTION = 500;

interface Props {
  open: boolean;
  onClose: () => void;
  run: Run | null;
  tx: ReturnType<typeof useTransaction>;
  canSubmit: boolean;
  needsChainSwitch?: boolean;
  onConnect: () => void;
}

export function ActionModal({ open, onClose, run, tx, canSubmit, needsChainSwitch, onConnect }: Props) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [confirming, setConfirming] = useState(false);

  const len = text.trim().length;
  const valid = len >= MIN_ACTION && len <= MAX_ACTION;
  const phase = tx.state.phase;
  const busy = phase === 'wallet' || phase === 'submitted' || phase === 'consensus';
  const done = phase === 'confirmed';
  const failed = phase === 'error';

  const error = useMemo(() => {
    if (len === 0) return null;
    if (len < MIN_ACTION) return `Describe your move — at least ${MIN_ACTION} characters.`;
    return null;
  }, [len]);

  const reset = () => {
    setText('');
    setConfirming(false);
    tx.reset();
  };
  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const submit = async () => {
    if (!run) return;
    setConfirming(false);
    const id = toast.push({ kind: 'loading', message: 'Confirm your move in your wallet...' });
    const ok = await tx.run(async (client) => {
      const hash = await writeAction(client, run.id, text.trim());
      toast.update(id, { kind: 'loading', message: 'The warden is deliberating...', hash });
      return hash;
    });
    if (ok) {
      toast.update(id, { kind: 'success', message: 'The warden has ruled.', hash: tx.state.hash ?? undefined });
    } else {
      toast.update(id, { kind: 'error', message: tx.state.error ?? 'The warden could not reach a verdict.' });
    }
  };

  const vColor = run ? vitalityColor(run.vitality) : '#f0a830';

  return (
    <Modal open={open} onClose={close} title={busy || done || failed ? undefined : 'Make your move'} dismissable={!busy}>
      {!run ? null : busy ? (
        <ConsensusStage state={tx.state} />
      ) : done ? (
        <div className="flex flex-col items-center py-4 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-signal-thrive/40 bg-signal-thrive/10">
            <Heart className="h-7 w-7 text-signal-thrive" />
          </div>
          <h3 className="font-mono text-xl font-semibold uppercase tracking-wide text-fog">The warden has ruled</h3>
          <p className="mt-2 max-w-sm text-fog-muted">
            Your fate for the day is sealed on-chain. Open the expedition log to read the verdict and see
            your vitality update.
          </p>
          <button onClick={close} className="btn-amber mt-6 rounded px-6 py-2.5 text-sm">
            Read the verdict
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-lg border border-fog/10 bg-base-900/40 p-4">
            <div className="flex items-center justify-between">
              <p className="label-caps text-fog-faint">{run.scenario_title}</p>
              <span className="font-mono text-xs" style={{ color: vColor }}>
                Day {run.day} &middot; {run.vitality}/100
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-fog-muted">{run.scenario_brief}</p>
          </div>

          <div>
            <label className="label-caps text-fog-faint">Your decision for today</label>
            <textarea
              value={text}
              maxLength={MAX_ACTION}
              rows={5}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe exactly what you do. Be specific and realistic — the warden rewards sound survival craft, not bravado."
              className="mt-2 w-full rounded-lg border border-fog/12 bg-base-900/50 px-4 py-3 text-fog outline-none transition-colors focus:border-amber/50"
            />
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-signal-peril">{error ?? ''}</span>
              <span className="text-fog-faint tnum">{text.length}/{MAX_ACTION}</span>
            </div>
          </div>

          {failed && tx.state.error && (
            <p className="rounded border border-signal-peril/30 bg-signal-peril/5 px-3 py-2 text-sm text-signal-peril">{tx.state.error}</p>
          )}

          {!confirming ? (
            <button
              onClick={() => (canSubmit ? setConfirming(true) : onConnect())}
              disabled={canSubmit && !valid}
              className="btn-amber flex w-full items-center justify-center gap-2 rounded py-3.5"
            >
              <Send className="h-4 w-4" />
              {canSubmit ? 'Submit to the warden' : needsChainSwitch ? 'Switch to Bradbury' : 'Connect wallet to act'}
            </button>
          ) : (
            <fm.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-amber/25 bg-amber/5 p-4">
              <p className="text-sm text-fog">
                This submits an AI transaction on Bradbury Testnet and takes one to five minutes. Network
                fees apply and are mostly refunded.
              </p>
              <p className="mt-1.5 text-xs text-fog-muted">
                Below the fee reserve? <ExternalLinkChip href={FAUCET}>Claim test GEN</ExternalLinkChip>
              </p>
              <div className="mt-4 flex gap-3">
                <button onClick={() => setConfirming(false)} className="btn-ghost flex-1 rounded py-2.5 text-sm text-fog-muted">
                  Back
                </button>
                <button onClick={submit} className="btn-amber flex-1 rounded py-2.5 text-sm">
                  Confirm and submit
                </button>
              </div>
            </fm.div>
          )}
        </div>
      )}
    </Modal>
  );
}
