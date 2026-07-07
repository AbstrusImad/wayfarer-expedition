'use client';

import { motion } from 'framer-motion';
import { Compass, RefreshCw, Wallet } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { RunCard } from '@/components/RunCard';
import { BeginModal } from '@/components/BeginModal';
import { ActionModal } from '@/components/ActionModal';
import { RunDetail } from '@/components/RunDetail';
import { Leaderboard } from '@/components/Leaderboard';
import { Footer } from '@/components/Footer';
import { SkeletonGrid, EmptyState, ErrorState } from '@/components/states';
import { ToastProvider } from '@/components/Toast';
import { useWallet } from '@/hooks/useWallet';
import { useContractData } from '@/hooks/useContractData';
import { useTransaction } from '@/hooks/useTransaction';
import { useToast } from '@/components/Toast';
import { writeClaim } from '@/lib/contract';
import type { Run } from '@/lib/format';

function Wayfarer() {
  const wallet = useWallet();
  const data = useContractData();
  const toast = useToast();

  const [beginOpen, setBeginOpen] = useState(false);
  const [actionRun, setActionRun] = useState<Run | null>(null);
  const [detailRun, setDetailRun] = useState<Run | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [claiming, setClaiming] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const canSubmit = !!wallet.address && wallet.onCorrectChain;

  const handleConfirmed = useCallback(async () => {
    await data.refresh();
    setRefreshKey((k) => k + 1);
  }, [data]);

  const tx = useTransaction({
    provider: wallet.provider,
    address: wallet.address,
    onTxFlight: data.setTxInFlight,
    onConfirmed: handleConfirmed,
  });

  useEffect(() => {
    if (data.runs.length && tx.state.phase === 'confirmed') {
      const newest = data.runs[0];
      setFlashId(newest.id);
      const t = setTimeout(() => setFlashId(null), 1800);
      return () => clearTimeout(t);
    }
  }, [data.runs, tx.state.phase]);

  const scrollToBoard = () => boardRef.current?.scrollIntoView({ behavior: 'smooth' });
  const openAction = (r: Run) => {
    setDetailRun(null);
    setActionRun(r);
  };
  const requireConnect = () => {
    if (!wallet.address) wallet.connect();
    else if (!wallet.onCorrectChain) wallet.switchChain();
  };
  // Connected but on the wrong network: offer a switch, not a misleading connect.
  const needsChainSwitch = !!wallet.address && !wallet.onCorrectChain;

  const ownerOf = (r: Run) => !!wallet.address && r.owner.toLowerCase() === wallet.address.toLowerCase();

  const handleClaim = useCallback(
    async (r: Run) => {
      setClaiming(true);
      const id = toast.push({ kind: 'loading', message: 'Confirm the claim in your wallet...' });
      try {
        const ok = await tx.run(async (client) => {
          const hash = await writeClaim(client, r.id);
          toast.update(id, { kind: 'loading', message: 'Releasing your reward on Bradbury...', hash });
          return hash;
        });
        if (ok) {
          toast.update(id, { kind: 'success', message: 'Reward on its way to your wallet.', hash: tx.state.hash ?? undefined });
          setDetailRun(null);
        } else {
          toast.update(id, { kind: 'error', message: tx.state.error ?? 'The claim could not be completed.' });
        }
      } finally {
        setClaiming(false);
      }
    },
    [toast, tx],
  );

  return (
    <>
      <Header wallet={wallet} />
      <main>
        <Hero onEnter={scrollToBoard} expeditions={data.stats.expeditions} turns={data.stats.turns} active={data.stats.active} />

        <HowItWorks />

        <section id="expeditions" ref={boardRef} className="mx-auto max-w-6xl px-5 py-24">
          <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="label-caps text-amber">// the field</p>
              <h2 className="mt-3 font-mono text-3xl font-bold uppercase leading-tight tracking-tight text-fog sm:text-4xl">
                Expeditions in progress
              </h2>
              {data.stale && (
                <p className="mt-2 font-mono text-xs text-fog-faint">
                  Showing data from a couple of minutes ago. Refreshing on the next cycle.
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => data.refresh()}
                aria-label="Refresh expeditions"
                className="btn-ghost flex h-11 w-11 items-center justify-center rounded text-fog-muted"
              >
                <RefreshCw className={`h-4 w-4 ${data.loading ? 'animate-spin-slow' : ''}`} />
              </button>
              {!wallet.address ? (
                <button onClick={wallet.connect} className="btn-amber flex items-center gap-2 rounded px-5 py-3 text-sm">
                  <Wallet className="h-4 w-4" /> Connect to play
                </button>
              ) : needsChainSwitch ? (
                <button onClick={wallet.switchChain} className="btn-amber flex items-center gap-2 rounded px-5 py-3 text-sm">
                  <Wallet className="h-4 w-4" /> Switch to Bradbury
                </button>
              ) : (
                <button onClick={() => setBeginOpen(true)} className="btn-amber flex items-center gap-2 rounded px-5 py-3 text-sm">
                  <Compass className="h-4 w-4" /> Begin expedition
                </button>
              )}
            </div>
          </div>

          {data.loading && data.runs.length === 0 ? (
            <SkeletonGrid count={4} />
          ) : data.error && data.runs.length === 0 ? (
            <ErrorState message={data.error} onRetry={() => data.refresh()} />
          ) : data.runs.length === 0 ? (
            <EmptyState
              onCreate={() => (canSubmit ? setBeginOpen(true) : requireConnect())}
              canCreate={canSubmit}
            />
          ) : (
            <motion.div layout className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {data.runs.map((r, i) => (
                <RunCard
                  key={r.id}
                  run={r}
                  index={i}
                  flash={flashId === r.id}
                  onOpen={setDetailRun}
                  onContinue={openAction}
                  isOwner={ownerOf(r)}
                />
              ))}
            </motion.div>
          )}
        </section>

        <Leaderboard refreshKey={refreshKey} onOpen={setDetailRun} />
      </main>

      <Footer />

      <BeginModal
        open={beginOpen}
        onClose={() => setBeginOpen(false)}
        scenarios={data.scenarios}
        tx={tx}
        canSubmit={canSubmit}
        needsChainSwitch={needsChainSwitch}
        onConnect={requireConnect}
      />
      <ActionModal
        open={!!actionRun}
        onClose={() => setActionRun(null)}
        run={actionRun}
        tx={tx}
        canSubmit={canSubmit}
        needsChainSwitch={needsChainSwitch}
        onConnect={requireConnect}
        onViewRun={(r) => setDetailRun(r)}
      />
      <RunDetail
        open={!!detailRun}
        onClose={() => setDetailRun(null)}
        run={detailRun}
        onContinue={openAction}
        onClaim={handleClaim}
        claiming={claiming}
        canAct={canSubmit}
        isOwner={!!detailRun && ownerOf(detailRun)}
        refreshKey={refreshKey}
      />
    </>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <Wayfarer />
    </ToastProvider>
  );
}
