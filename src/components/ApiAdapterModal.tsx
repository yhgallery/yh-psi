import React, { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';

interface ApiAdapterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADAPTER_SNIPPET = `import { PsiDataProvider, PsiSnapshot, RegionId } from '../types/psi';
import { getPsiBand } from '../data/neaStandards';

// Wire this provider when connecting to Singapore data.gov.sg or your proxy
export const liveNeaProvider: PsiDataProvider = {
  id: 'nea-data-gov-sg',
  label: 'NEA Singapore Live API',
  async fetchSnapshot(): Promise<PsiSnapshot> {
    const [psiRes, pm25Res] = await Promise.all([
      fetch('https://api.data.gov.sg/v1/environment/psi'),
      fetch('https://api.data.gov.sg/v1/environment/pm25'),
    ]);
    const psiJson = await psiRes.json();
    const pm25Json = await pm25Res.json();

    const latestPsi = psiJson.items[0].readings;
    const latestPm25 = pm25Json.items[0].readings.pm25_one_hourly;
    // Map north, south, east, west, central into PsiSnapshot
    ...
  },
};`;

export const ApiAdapterModal: React.FC<ApiAdapterModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ADAPTER_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-adapter-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="api-adapter-title" className="text-lg font-bold text-slate-900">
              API Connection Adapter
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Frontend-ready interface for connecting Singapore NEA / data.gov.sg endpoints
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-sm text-slate-700 leading-relaxed">
            This application currently runs on <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">mockPsiProvider</code>{' '}
            implementing the <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">PsiDataProvider</code> interface in{' '}
            <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">src/types/psi.ts</code>. Swap the provider in{' '}
            <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">src/App.tsx</code> when your API connection is ready.
          </div>

          <div className="relative bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  Copy Snippet
                </>
              )}
            </button>
            <pre className="text-xs font-mono leading-relaxed pr-24">
              <code>{ADAPTER_SNIPPET}</code>
            </pre>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <span>Target endpoints: /v1/environment/psi &amp; /v1/environment/pm25</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
