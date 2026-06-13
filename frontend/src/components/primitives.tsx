'use client';

import { Check, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { copyText } from '@/lib/format';

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        if (await copyText(value)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }
      }}
      aria-label={label ?? 'Copy to clipboard'}
      className="relative inline-flex items-center text-fog-faint transition-colors hover:text-amber"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-signal-thrive" /> : <Copy className="h-3.5 w-3.5" />}
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-base-600 px-2 py-1 text-[10px] text-fog">
          Copied
        </span>
      )}
    </button>
  );
}

export function ExternalLinkChip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-amber transition-colors hover:text-amber-bright"
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
