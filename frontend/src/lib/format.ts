export const shortAddr = (a?: string): string =>
  a && a.length >= 10 ? `${a.slice(0, 6)}\u2026${a.slice(-4)}` : a ?? '';

export const shortHash = (h?: string): string =>
  h && h.length >= 14 ? `${h.slice(0, 10)}\u2026${h.slice(-8)}` : h ?? '';

export type Verdict = 'THRIVE' | 'STABLE' | 'SETBACK' | 'PERIL';
export type RunStatus = 'ALIVE' | 'LOST' | 'ABANDONED';

export interface Scenario {
  key: string;
  title: string;
  brief: string;
}

export interface LogEntry {
  day: number;
  action: string;
  delta: number;
  verdict: Verdict;
  narrative: string;
  vitality_after: number;
}

export interface Run {
  id: string;
  owner: string;
  scenario_key: string;
  scenario_title: string;
  scenario_brief: string;
  day: number;
  vitality: number;
  status: RunStatus;
  turns: number;
  log?: LogEntry[];
}

export interface Stats {
  expeditions: number;
  turns: number;
  active: number;
}

export const verdictColor = (v: Verdict): string => {
  switch (v) {
    case 'THRIVE':
      return 'text-signal-thrive border-signal-thrive/40 bg-signal-thrive/10';
    case 'STABLE':
      return 'text-signal-stable border-signal-stable/40 bg-signal-stable/10';
    case 'SETBACK':
      return 'text-signal-setback border-signal-setback/40 bg-signal-setback/10';
    default:
      return 'text-signal-peril border-signal-peril/40 bg-signal-peril/10';
  }
};

export const vitalityColor = (v: number): string => {
  if (v >= 66) return '#43d17a';
  if (v >= 33) return '#e8a23d';
  return '#e5564b';
};

export const statusLabel: Record<RunStatus, string> = {
  ALIVE: 'In progress',
  LOST: 'Perished',
  ABANDONED: 'Abandoned',
};

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
