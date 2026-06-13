'use client';

import { motion } from 'framer-motion';
import { Compass, RefreshCw, TriangleAlert } from 'lucide-react';
import { EXPLORER } from '@/lib/contract';
import { ExternalLinkChip } from './primitives';

export function RunSkeleton() {
  return (
    <div className="panel rounded-lg p-6">
      <div className="skeleton mb-4 h-3 w-24 rounded" />
      <div className="skeleton mb-3 h-6 w-3/4 rounded" />
      <div className="skeleton mb-2 h-4 w-full rounded" />
      <div className="skeleton mb-5 h-4 w-2/3 rounded" />
      <div className="skeleton h-2 w-full rounded-full" />
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <RunSkeleton key={i} />
      ))}
    </div>
  );
}

export function EmptyState({ onCreate, canCreate }: { onCreate: () => void; canCreate: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel flex flex-col items-center rounded-xl px-6 py-16 text-center"
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded border border-amber/25 bg-amber/5">
        <Compass className="h-7 w-7 text-amber" />
      </div>
      <h3 className="font-mono text-xl font-semibold uppercase tracking-wide text-fog">No expeditions yet</h3>
      <p className="mt-3 max-w-md text-fog-muted">
        No one has set out into the wild. Be the first to strand yourself and see how many days you can
        outlast the warden&apos;s judgment.
      </p>
      <button onClick={onCreate} className="btn-amber mt-7 rounded px-6 py-3 text-sm">
        {canCreate ? 'Begin the first expedition' : 'Connect wallet to begin'}
      </button>
    </motion.div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel flex flex-col items-center rounded-xl border-signal-peril/30 px-6 py-16 text-center"
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded border border-signal-peril/30 bg-signal-peril/5">
        <TriangleAlert className="h-7 w-7 text-signal-peril" />
      </div>
      <h3 className="font-mono text-xl font-semibold uppercase tracking-wide text-fog">Could not reach the contract</h3>
      <p className="mt-3 max-w-md text-fog-muted">{message}</p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
        <button onClick={onRetry} className="btn-amber flex items-center gap-2 rounded px-6 py-3 text-sm">
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
        <ExternalLinkChip href={EXPLORER}>Open the explorer</ExternalLinkChip>
      </div>
    </motion.div>
  );
}
