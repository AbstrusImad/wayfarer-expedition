'use client';

import { Heart, Loader2, Play, Skull } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Modal } from './Modal';
import { CopyButton } from './primitives';
import { Award } from 'lucide-react';
import { fetchRun } from '@/lib/contract';
import { fromAtto, shortAddr, statusLabel, verdictColor, vitalityColor, type Run } from '@/lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  run: Run | null;
  onContinue: (r: Run) => void;
  onClaim: (r: Run) => void;
  claiming: boolean;
  canAct: boolean;
  isOwner: boolean;
  refreshKey: number;
}

export function RunDetail({ open, onClose, run, onContinue, onClaim, claiming, canAct, isOwner, refreshKey }: Props) {
  const [full, setFull] = useState<Run | null>(run);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!run) return;
    setLoading(true);
    try {
      setFull(await fetchRun(run.id));
    } catch {
      setFull(run);
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    if (open && run) {
      setFull(run);
      load();
    }
  }, [open, run, load, refreshKey]);

  if (!run) return null;
  const r = full ?? run;
  const alive = r.status === 'ALIVE';
  const vColor = vitalityColor(r.vitality);
  const log = [...(r.log ?? [])].reverse();

  return (
    <Modal open={open} onClose={onClose} dismissable wide>
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="label-caps text-amber">{r.scenario_title}</span>
          {alive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-signal-thrive/30 px-2.5 py-1 font-mono text-[11px] text-signal-thrive">
              <span className="h-1.5 w-1.5 rounded-full bg-signal-thrive animate-pulse-soft" /> Alive
            </span>
          ) : r.status === 'RESCUED' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-signal-thrive/30 px-2.5 py-1 font-mono text-[11px] text-signal-thrive">
              <Award className="h-3 w-3" /> {statusLabel[r.status]}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-fog/20 px-2.5 py-1 font-mono text-[11px] text-fog-muted">
              {r.status === 'LOST' ? <Skull className="h-3 w-3" /> : null} {statusLabel[r.status]}
            </span>
          )}
        </div>

        <h2 className="mt-2 font-mono text-2xl font-bold uppercase tracking-wide text-fog">
          Day {r.day} <span className="text-fog-faint">/</span> {r.id}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-fog-muted">{r.scenario_brief}</p>

        <div className="mt-5 rounded-lg border border-fog/10 bg-base-900/40 p-4">
          <div className="mb-1.5 flex items-center justify-between font-mono text-xs">
            <span className="flex items-center gap-1.5 text-fog-muted">
              <Heart className="h-3.5 w-3.5" style={{ color: vColor }} /> Vitality
            </span>
            <span className="tnum" style={{ color: vColor }}>
              {r.vitality}/100
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-base-900">
            <div className="vbar h-full rounded-full" style={{ width: `${r.vitality}%`, backgroundColor: vColor }} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-xs text-fog-faint">
            wayfarer {shortAddr(r.owner)} <CopyButton value={r.owner} />
          </span>
          {alive && isOwner && (
            <button onClick={() => onContinue(r)} disabled={!canAct} className="btn-amber inline-flex items-center gap-2 rounded px-4 py-2 text-sm">
              <Play className="h-4 w-4" /> {canAct ? 'Make your next move' : 'Connect to act'}
            </button>
          )}
        </div>

        {/* Survival Stakes: stake, and claim for rescued survivors */}
        {Number(r.stake ?? '0') > 0 && (
          <div className="mt-4 rounded-lg border border-fog/10 bg-base-900/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono text-xs text-fog-muted">
                Stake <span className="text-fog">{fromAtto(r.stake)} GEN</span>
                {r.status === 'RESCUED' && r.claimed && Number(r.payout) > 0 && (
                  <span className="ml-3 text-signal-thrive">claimed {fromAtto(r.payout)} GEN</span>
                )}
              </div>
              {r.status === 'RESCUED' && isOwner && !r.claimed && (
                <button
                  onClick={() => onClaim(r)}
                  disabled={!canAct || claiming}
                  className="btn-amber inline-flex items-center gap-2 rounded px-4 py-2 text-sm"
                >
                  {claiming ? <Loader2 className="h-4 w-4 animate-spin-slow" /> : <Award className="h-4 w-4" />}
                  {canAct ? 'Claim stake + pot share' : 'Connect to claim'}
                </button>
              )}
              {r.status === 'RESCUED' && r.claimed && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-signal-thrive/30 px-2.5 py-1 font-mono text-[11px] text-signal-thrive">
                  <Award className="h-3 w-3" /> Reward claimed
                </span>
              )}
            </div>
            {r.status === 'RESCUED' && !r.claimed && (
              <p className="mt-2 text-xs leading-relaxed text-fog-muted">
                You survived to rescue day {r.rescue_day}. Claim returns your stake plus a bonus from the pot (capped at the pot balance).
              </p>
            )}
          </div>
        )}

        <div className="mt-7 flex items-center gap-2 border-t border-fog/8 pt-6">
          <h3 className="font-mono text-base font-semibold uppercase tracking-wide text-fog">Field journal</h3>
          {loading && <Loader2 className="h-4 w-4 animate-spin-slow text-amber" />}
        </div>

        <div className="mt-4 space-y-4">
          {log.length === 0 ? (
            <div className="rounded-lg border border-dashed border-fog/15 py-10 text-center text-fog-muted">
              No decisions yet. The journal fills as you act.
            </div>
          ) : (
            log.map((e, i) => (
              <div key={i} className="rounded-lg border border-fog/10 bg-base-900/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-fog-faint">Day {e.day}</span>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${verdictColor(e.verdict)}`}>{e.verdict}</span>
                    <span className={`font-mono text-sm font-bold tnum ${e.delta >= 0 ? 'text-signal-thrive' : 'text-signal-peril'}`}>
                      {e.delta >= 0 ? '+' : ''}
                      {e.delta}
                    </span>
                  </div>
                </div>
                <p className="mt-2.5 text-sm text-fog">{e.action}</p>
                <p className="mt-2 border-l-2 border-amber/40 pl-3 text-sm italic leading-relaxed text-fog-muted">{e.narrative}</p>
                <p className="mt-2 font-mono text-[11px] text-fog-faint">vitality after &middot; {e.vitality_after}/100</p>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
