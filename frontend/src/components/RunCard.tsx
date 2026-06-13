'use client';

import { motion } from 'framer-motion';
import { Heart, Play, Skull, Flag } from 'lucide-react';
import { shortAddr, statusLabel, vitalityColor, type Run } from '@/lib/format';

interface RunCardProps {
  run: Run;
  index: number;
  flash?: boolean;
  onOpen: (r: Run) => void;
  onContinue: (r: Run) => void;
  isOwner: boolean;
}

export function RunCard({ run, index, flash, onOpen, onContinue, isOwner }: RunCardProps) {
  const alive = run.status === 'ALIVE';
  const lost = run.status === 'LOST';
  const vColor = vitalityColor(run.vitality);

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3) }}
      className={`panel panel-hover group flex flex-col rounded-lg p-6 ${flash ? 'animate-flash-amber' : ''}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="label-caps text-fog-faint">{run.scenario_title}</span>
        {alive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-signal-thrive/30 px-2.5 py-1 font-mono text-[11px] text-signal-thrive">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-thrive animate-pulse-soft" /> Alive
          </span>
        ) : lost ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-signal-peril/30 px-2.5 py-1 font-mono text-[11px] text-signal-peril">
            <Skull className="h-3 w-3" /> {statusLabel[run.status]}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-fog/15 px-2.5 py-1 font-mono text-[11px] text-fog-muted">
            <Flag className="h-3 w-3" /> {statusLabel[run.status]}
          </span>
        )}
      </div>

      <button onClick={() => onOpen(run)} className="text-left">
        <h3 className="font-mono text-lg font-semibold text-fog transition-colors group-hover:text-amber-bright">
          Day {run.day} <span className="text-fog-faint">/</span> {run.id}
        </h3>
      </button>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-fog-muted">{run.scenario_brief}</p>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[11px]">
          <span className="flex items-center gap-1.5 text-fog-muted">
            <Heart className="h-3 w-3" style={{ color: vColor }} /> Vitality
          </span>
          <span className="tnum" style={{ color: vColor }}>
            {run.vitality}/100
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-base-900">
          <div className="vbar h-full rounded-full" style={{ width: `${run.vitality}%`, backgroundColor: vColor }} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-fog/8 pt-4">
        <button
          onClick={() => onOpen(run)}
          className="font-mono text-xs text-fog-muted transition-colors hover:text-amber"
        >
          {run.turns} {run.turns === 1 ? 'decision' : 'decisions'} logged
        </button>
        {alive && isOwner && (
          <button
            onClick={() => onContinue(run)}
            className="btn-ghost inline-flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs text-fog"
          >
            <Play className="h-3.5 w-3.5" /> Continue
          </button>
        )}
      </div>

      <p className="mt-3 font-mono text-[11px] text-fog-faint">wayfarer {shortAddr(run.owner)}</p>
    </motion.article>
  );
}
