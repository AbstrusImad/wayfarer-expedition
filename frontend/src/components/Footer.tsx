'use client';

import { WayfarerMark } from './Brand';
import { CopyButton, ExternalLinkChip } from './primitives';
import { CONTRACT_ADDRESS, DEPLOY_TX, EXPLORER, FAUCET, explorerAddr, explorerTx } from '@/lib/contract';
import { shortAddr, shortHash } from '@/lib/format';

export function Footer() {
  return (
    <footer className="border-t border-fog/10 bg-base-900/50">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <WayfarerMark />
              <span className="font-mono text-lg font-semibold uppercase tracking-wide text-fog">Wayfarer</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fog-muted">
              An on-chain survival simulator where an AI warden judges every decision under validator
              consensus on GenLayer. No deposits, no custody, no game server — only your wits on the record.
            </p>
          </div>

          <div>
            <p className="label-caps text-fog-faint">Resources</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <ExternalLinkChip href={FAUCET}>Bradbury faucet</ExternalLinkChip>
              </li>
              <li>
                <ExternalLinkChip href={EXPLORER}>Block explorer</ExternalLinkChip>
              </li>
              <li>
                <ExternalLinkChip href="https://docs.genlayer.com">GenLayer docs</ExternalLinkChip>
              </li>
            </ul>
          </div>

          <div>
            <p className="label-caps text-fog-faint">On-chain</p>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="font-mono text-xs text-fog-faint">Contract</p>
                <span className="mt-0.5 inline-flex items-center gap-2 font-mono text-fog">
                  <a href={explorerAddr(CONTRACT_ADDRESS)} target="_blank" rel="noopener noreferrer" className="hover:text-amber">
                    {shortAddr(CONTRACT_ADDRESS)}
                  </a>
                  <CopyButton value={CONTRACT_ADDRESS} />
                </span>
              </div>
              <div>
                <p className="font-mono text-xs text-fog-faint">Deployment tx</p>
                <a href={explorerTx(DEPLOY_TX)} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-block font-mono text-fog hover:text-amber">
                  {shortHash(DEPLOY_TX)}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-fog/8 pt-6 font-mono text-xs text-fog-faint sm:flex-row sm:items-center">
          <p>Built on GenLayer Bradbury Testnet. For demonstration only.</p>
          <p>chain 4221 &middot; GEN</p>
        </div>
      </div>
    </footer>
  );
}
