import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import type { Run, Scenario, Stats } from './format';

export const CONTRACT_ADDRESS = '0xaC78973442416599Cf366812e9ba7B6d1545445B' as const;
export const DEPLOY_TX = '0xab1d4ecf7bd73cef80a31d92920a87bcaf72c9e300ce71dc2d328dc3d4a5faf3' as const;
export const EXPLORER = 'https://explorer-bradbury.genlayer.com';
export const FAUCET = 'https://testnet-faucet.genlayer.foundation/';
export const CHAIN_ID = 4221;
export const CHAIN_ID_HEX = '0x107D';

export const explorerTx = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const explorerAddr = (addr: string) => `${EXPLORER}/address/${addr}`;

export const readClient = createClient({ chain: testnetBradbury });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const makeWalletClient = (account: `0x${string}`, provider: any): any =>
  createClient({ chain: testnetBradbury, account, provider });

const RETRYABLE = /rate limit|429|timeout|network|fetch|temporarily|ECONN|socket/i;

export async function withRpcRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!RETRYABLE.test(String(e))) throw e;
      await new Promise((r) => setTimeout(r, 2500 * 2 ** i));
    }
  }
  throw last;
}

function normalizeRun(o: Record<string, unknown>): Run {
  const rawLog = Array.isArray(o.log) ? (o.log as Record<string, unknown>[]) : undefined;
  return {
    id: String(o.id ?? ''),
    owner: String(o.owner ?? ''),
    scenario_key: String(o.scenario_key ?? ''),
    scenario_title: String(o.scenario_title ?? ''),
    scenario_brief: String(o.scenario_brief ?? ''),
    day: Number(o.day ?? 1),
    vitality: Number(o.vitality ?? 0),
    status: (String(o.status ?? 'ALIVE') as Run['status']),
    turns: Number(o.turns ?? 0),
    log: rawLog?.map((e) => ({
      day: Number(e.day ?? 0),
      action: String(e.action ?? ''),
      delta: Number(e.delta ?? 0),
      verdict: String(e.verdict ?? 'STABLE') as import('./format').Verdict,
      narrative: String(e.narrative ?? ''),
      vitality_after: Number(e.vitality_after ?? 0),
    })),
  };
}

export async function fetchStats(): Promise<Stats> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_stats', args: [] }),
  );
  const o = raw as Record<string, unknown>;
  return { expeditions: Number(o.expeditions ?? 0), turns: Number(o.turns ?? 0), active: Number(o.active ?? 0) };
}

export async function fetchScenarios(): Promise<Scenario[]> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_scenarios', args: [] }),
  );
  return ((raw as Record<string, unknown>[]) ?? []).map((s) => ({
    key: String(s.key ?? ''),
    title: String(s.title ?? ''),
    brief: String(s.brief ?? ''),
  }));
}

export async function fetchRuns(start = 0): Promise<Run[]> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_runs', args: [start] }),
  );
  return ((raw as Record<string, unknown>[]) ?? []).map(normalizeRun);
}

export async function fetchRun(id: string): Promise<Run> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_run', args: [id] }),
  );
  return normalizeRun(raw as Record<string, unknown>);
}

export async function fetchLeaderboard(start = 0): Promise<Run[]> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_leaderboard', args: [start] }),
  );
  return ((raw as Record<string, unknown>[]) ?? []).map(normalizeRun);
}

// ---------------- writes ----------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function writeBegin(client: any, scenarioKey: string): Promise<`0x${string}`> {
  return client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'begin_expedition',
    args: [scenarioKey],
    value: BigInt(0),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function writeAction(client: any, runId: string, action: string): Promise<`0x${string}`> {
  return client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'take_action',
    args: [runId, action],
    value: BigInt(0),
  });
}

// ---------------- transaction polling ----------------

const STATUS_NAME: Record<string, string> = {
  '1': 'PENDING',
  '2': 'PROPOSING',
  '3': 'COMMITTING',
  '4': 'REVEALING',
  '5': 'ACCEPTED',
  '6': 'UNDETERMINED',
  '7': 'FINALIZED',
  '8': 'CANCELED',
  '12': 'VALIDATORS_TIMEOUT',
  '13': 'LEADER_TIMEOUT',
};

export const statusName = (s: unknown): string =>
  STATUS_NAME[String(s)] ?? String(s ?? 'PENDING').toUpperCase();

const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED']);

export interface WardenDraft {
  delta?: number;
  narrative?: string;
}

function pick(obj: unknown, key: string): unknown {
  if (obj instanceof Map) return obj.get(key);
  if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key];
  return undefined;
}

export function extractWardenDraft(tx: unknown): WardenDraft | null {
  try {
    const receipts = pick(pick(tx, 'consensus_data'), 'leader_receipt');
    const first = Array.isArray(receipts) ? receipts[0] : receipts;
    const b64 = pick(pick(first, 'eq_outputs'), '0');
    if (typeof b64 !== 'string' || b64.length === 0) return null;
    const text = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    for (let i = text.length - 1; i >= 0; i--) {
      if (text[i] !== '{') continue;
      try {
        const obj = JSON.parse(text.slice(i));
        if (obj && typeof obj === 'object' && ('delta' in obj || 'narrative' in obj)) {
          return { delta: Number(obj.delta), narrative: obj.narrative };
        }
      } catch {
        /* keep scanning */
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function pollUntilDecided(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  hash: `0x${string}`,
  onUpdate?: (status: string, draft: WardenDraft | null) => void,
): Promise<{ status: string; draft: WardenDraft | null }> {
  let draft: WardenDraft | null = null;
  for (let i = 0; i < 160; i++) {
    let tx: unknown = null;
    try {
      tx = await client.getTransaction({ hash } as Parameters<typeof client.getTransaction>[0]);
    } catch {
      tx = null;
    }
    const status = statusName((tx as { status?: unknown })?.status);
    const peek = tx ? extractWardenDraft(tx) : null;
    if (peek) draft = peek;
    onUpdate?.(status, draft);
    if (TERMINAL.has(status)) return { status, draft };
    await new Promise((r) => setTimeout(r, 8000));
  }
  return { status: 'TIMEOUT', draft };
}
