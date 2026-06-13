'use client';

import { useCallback, useRef, useState } from 'react';
import { WardenDraft, makeWalletClient, pollUntilDecided } from '@/lib/contract';

export type TxPhase = 'idle' | 'wallet' | 'submitted' | 'consensus' | 'confirmed' | 'error';

export interface TxState {
  phase: TxPhase;
  hash: `0x${string}` | null;
  liveStatus: string | null;
  draft: WardenDraft | null;
  error: string | null;
}

const INITIAL: TxState = { phase: 'idle', hash: null, liveStatus: null, draft: null, error: null };

function friendlyError(e: unknown): string {
  const s = String(e);
  if (/LackOfFundForMaxFee|insufficient/i.test(s)) {
    return 'Your wallet is below the fee reserve for AI transactions (it is mostly refunded). Claim test GEN from the faucet and retry.';
  }
  if (/user rejected|denied|cancell?ed/i.test(s)) return 'You cancelled the signature.';
  if (/rate limit|429/i.test(s)) return 'The network is busy. Wait a moment and retry.';
  if (/network|fetch|timeout|ECONN/i.test(s)) return 'Network error reaching Bradbury. Your transaction may still be processing.';
  return 'The transaction could not be completed. Please retry.';
}

export interface UseTransactionArgs {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any;
  address: `0x${string}` | null;
  onTxFlight?: (inFlight: boolean) => void;
  onConfirmed?: () => void | Promise<void>;
}

export function useTransaction({ provider, address, onTxFlight, onConfirmed }: UseTransactionArgs) {
  const [state, setState] = useState<TxState>(INITIAL);
  const submitting = useRef(false);

  const reset = useCallback(() => setState(INITIAL), []);

  const run = useCallback(
    async (send: (client: ReturnType<typeof makeWalletClient>) => Promise<`0x${string}`>): Promise<boolean> => {
      if (submitting.current) return false;
      if (!provider || !address) {
        setState({ ...INITIAL, phase: 'error', error: 'Connect your wallet first.' });
        return false;
      }
      submitting.current = true;
      onTxFlight?.(true);
      setState({ ...INITIAL, phase: 'wallet' });
      try {
        const client = makeWalletClient(address, provider);
        const hash = await send(client);
        setState({ phase: 'submitted', hash, liveStatus: 'PENDING', draft: null, error: null });
        setState((s) => ({ ...s, phase: 'consensus' }));
        const { status, draft } = await pollUntilDecided(client, hash, (st, dr) => {
          setState((s) => ({ ...s, liveStatus: st, draft: dr ?? s.draft }));
        });
        if (status === 'ACCEPTED' || status === 'FINALIZED') {
          setState((s) => ({ ...s, phase: 'confirmed', liveStatus: status }));
          await onConfirmed?.();
          submitting.current = false;
          onTxFlight?.(false);
          return true;
        }
        const failMsg =
          status === 'UNDETERMINED'
            ? 'The validators could not reach consensus on this decision. Try rephrasing and resubmitting.'
            : status === 'CANCELED'
              ? 'The transaction was canceled by the network.'
              : 'The network is congested and the transaction is still pending. Check the explorer shortly.';
        setState((s) => ({ ...s, phase: 'error', liveStatus: status, error: failMsg }));
        submitting.current = false;
        onTxFlight?.(false);
        return false;
      } catch (e) {
        setState((s) => ({ ...s, phase: 'error', error: friendlyError(e) }));
        submitting.current = false;
        onTxFlight?.(false);
        return false;
      }
    },
    [provider, address, onTxFlight, onConfirmed],
  );

  return { state, run, reset };
}
