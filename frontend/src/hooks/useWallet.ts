'use client';

import { useCallback, useEffect, useState } from 'react';
import { CHAIN_ID, CHAIN_ID_HEX } from '@/lib/contract';

const BRADBURY_PARAMS = {
  chainId: CHAIN_ID_HEX,
  chainName: 'GenLayer Bradbury Testnet',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: ['https://rpc-bradbury.genlayer.com'],
  blockExplorerUrls: ['https://explorer-bradbury.genlayer.com/'],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getProvider(): any {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).ethereum ?? null;
}

export interface WalletState {
  address: `0x${string}` | null;
  chainId: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any;
  connecting: boolean;
  hasProvider: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    provider: null,
    connecting: false,
    hasProvider: false,
    error: null,
  });

  useEffect(() => {
    const provider = getProvider();
    setState((s) => ({ ...s, provider, hasProvider: !!provider }));
    if (!provider) return;

    const onAccounts = (accounts: string[]) => {
      setState((s) => ({ ...s, address: (accounts[0] as `0x${string}`) ?? null }));
    };
    const onChain = (cid: string) => {
      setState((s) => ({ ...s, chainId: parseInt(cid, 16) }));
    };

    provider.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
      if (accounts?.length) setState((s) => ({ ...s, address: accounts[0] as `0x${string}` }));
    });
    provider.request({ method: 'eth_chainId' }).then((cid: string) => {
      setState((s) => ({ ...s, chainId: parseInt(cid, 16) }));
    });

    provider.on?.('accountsChanged', onAccounts);
    provider.on?.('chainChanged', onChain);
    return () => {
      provider.removeListener?.('accountsChanged', onAccounts);
      provider.removeListener?.('chainChanged', onChain);
    };
  }, []);

  const connect = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      setState((s) => ({ ...s, hasProvider: false, error: 'No wallet detected' }));
      return;
    }
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' });
      try {
        await provider.request({ method: 'wallet_addEthereumChain', params: [BRADBURY_PARAMS] });
      } catch {
        /* chain may already exist */
      }
      try {
        await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
      } catch {
        /* user may decline */
      }
      const cid: string = await provider.request({ method: 'eth_chainId' });
      setState((s) => ({
        ...s,
        address: (accounts[0] as `0x${string}`) ?? null,
        chainId: parseInt(cid, 16),
        connecting: false,
        provider,
        hasProvider: true,
      }));
    } catch (e) {
      const msg = /user rejected|denied/i.test(String(e))
        ? 'You cancelled the connection request'
        : 'Could not connect to the wallet';
      setState((s) => ({ ...s, connecting: false, error: msg }));
    }
  }, []);

  const disconnect = useCallback(() => setState((s) => ({ ...s, address: null })), []);

  const onCorrectChain = state.chainId === CHAIN_ID;

  return { ...state, connect, disconnect, onCorrectChain };
}
