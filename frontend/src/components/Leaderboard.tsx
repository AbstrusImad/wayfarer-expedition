'use client';

import { motion } from 'framer-motion';
import { Award, Loader2, Skull } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { fetchLeaderboard } from '@/lib/contract';
import { shortAddr, statusLabel, vitalityColor, type Run } from '@/lib/format';

export function Leaderboard({ refreshKey, onOpen }: { refreshKey: number; onOpen: (r: Run) => void }) {
  const [rows, setRows] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows((await fetchLeaderboard(0)).slice(0, 8));
    } catch {
      setError('Could not load the survivors roll.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <section id="survivors" className="mx-auto max-w-6xl px-5 py-28">
      <div className="mb-12 flex items-end justify-between gap-4">
        <div>
          <p className="label-caps text-amber">// survivors roll</p>
          <h2 className="mt-3 font-mono text-3xl font-bold uppercase leading-tight tracking-tight text-fog sm:text-4xl">
            Who lasted longest
          </h2>
        </div>
        <Award className="hidden h-10 w-10 text-amber/40 sm:block" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-fog-muted">
          <Loader2 className="h-5 w-5 animate-spin-slow text-amber" /> Tallying survivors...
        </div>
      ) : error ? (
        <div className="panel rounded-lg p-8 text-center text-fog-muted">
          {error}
          <button onClick={load} className="mt-3 block w-full text-amber">
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="panel rounded-lg border-dashed p-12 text-center text-fog-muted">
          No expeditions on the board yet. The first to survive a few days will top this roll.
        </div>
      ) : (
        <motion.div layout className="overflow-hidden rounded-lg border border-fog/10">
          {rows.map((r, i) => {
            const vColor = vitalityColor(r.vitality);
            return (
              <button
                key={r.id}
                onClick={() => onOpen(r)}
                className="flex w-full items-center gap-4 border-b border-fog/8 bg-base-800/40 px-5 py-4 text-left transition-colors last:border-0 hover:bg-base-700/40"
              >
                <span className="w-8 shrink-0 font-mono text-lg font-bold text-fog-faint tnum">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-semibold text-fog">
                    {r.scenario_title}
                  </p>
                  <p className="font-mono text-[11px] text-fog-faint">{shortAddr(r.owner)} &middot; {r.turns} decisions</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xl font-bold text-amber tnum">Day {r.day}</p>
                  <p className="flex items-center justify-end gap-1.5 font-mono text-[11px]" style={{ color: r.status === 'ALIVE' ? vColor : undefined }}>
                    {r.status === 'LOST' && <Skull className="h-3 w-3 text-signal-peril" />}
                    {r.status === 'ALIVE' ? `${r.vitality}/100` : statusLabel[r.status]}
                  </p>
                </div>
              </button>
            );
          })}
        </motion.div>
      )}
    </section>
  );
}
