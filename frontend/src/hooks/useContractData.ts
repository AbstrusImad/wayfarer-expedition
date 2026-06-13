'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchRuns, fetchScenarios, fetchStats } from '@/lib/contract';
import type { Run, Scenario, Stats } from '@/lib/format';

const POLL_MS = 95_000;

export interface ContractData {
  runs: Run[];
  scenarios: Scenario[];
  stats: Stats;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  stale: boolean;
  refresh: () => Promise<void>;
  setTxInFlight: (v: boolean) => void;
}

function classifyError(e: unknown): string {
  const s = String(e);
  if (/contract not found|execution reverted|no contract/i.test(s)) {
    return 'No contract was found at the configured address on Bradbury. The deployment may need to be repaired.';
  }
  if (/rate limit|429/i.test(s)) return 'The network is rate-limiting reads. Retrying shortly.';
  return 'Could not reach the expedition contract on Bradbury Testnet.';
}

export function useContractData(): ContractData {
  const [runs, setRuns] = useState<Run[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [stats, setStats] = useState<Stats>({ expeditions: 0, turns: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const alive = useRef(true);
  const txInFlight = useRef(false);
  const gotScenarios = useRef(false);

  const load = useCallback(async (showLoading: boolean) => {
    if (txInFlight.current) return;
    if (showLoading) setLoading(true);
    try {
      const [s, r] = await Promise.all([fetchStats(), fetchRuns(0)]);
      if (!alive.current) return;
      setStats(s);
      setRuns(r);
      setError(null);
      setLastUpdated(Date.now());
      if (!gotScenarios.current) {
        try {
          const sc = await fetchScenarios();
          if (alive.current && sc.length) {
            setScenarios(sc);
            gotScenarios.current = true;
          }
        } catch {
          /* scenarios are non-critical; UI has a fallback */
        }
      }
    } catch (e) {
      if (!alive.current) return;
      setError(classifyError(e));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    load(true);
    const id = setInterval(() => load(false), POLL_MS);
    return () => {
      alive.current = false;
      clearInterval(id);
    };
  }, [load]);

  const refresh = useCallback(async () => {
    await load(false);
  }, [load]);

  const setTxInFlight = useCallback((v: boolean) => {
    txInFlight.current = v;
  }, []);

  const stale = useMemo(() => {
    if (!lastUpdated) return false;
    return Date.now() - lastUpdated > 150_000;
  }, [lastUpdated]);

  return { runs, scenarios, stats, loading, error, lastUpdated, stale, refresh, setTxInFlight };
}
