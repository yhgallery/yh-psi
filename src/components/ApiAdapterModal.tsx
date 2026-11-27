import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { ApiHealthStatus, fetchApiHealth } from '../services/psiLiveProvider';

interface ApiAdapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceMode: 'live' | 'simulation';
  onSwitchToLive: () => void;
}

export const ApiAdapterModal: React.FC<ApiAdapterModalProps> = ({
  isOpen,
  onClose,
  sourceMode,
  onSwitchToLive,
}) => {
  const [health, setHealth] = useState<ApiHealthStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runHealthCheck = async () => {
    setChecking(true);
    setErrorMsg(null);
    try {
      const data = await fetchApiHealth(true);
      setHealth(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reach /api/health');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void runHealthCheck();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-adapter-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="api-adapter-title" className="text-lg font-bold text-slate-900">
              Serverless API Connection
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Project-root /api/psi.ts and /api/health.ts handlers connected to data.gov.sg v2
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

        <div className="p-6 space-y-5">
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-slate-500">Serverless PSI Endpoint</span>
              <code className="font-mono text-slate-900">/api/psi</code>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-slate-500">Serverless Health Endpoint</span>
              <code className="font-mono text-slate-900">/api/health</code>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-slate-500 shrink-0">Upstream Source</span>
              <code className="font-mono text-slate-700 truncate">
                https://api-open.data.gov.sg/v2/real-time/api/psi
              </code>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-slate-500">Connection Verification</span>
              {checking ? (
                <span className="font-mono text-slate-500">Checking upstream...</span>
              ) : errorMsg ? (
                <span className="font-medium text-rose-700">{errorMsg}</span>
              ) : health ? (
                <span
                  className={`font-semibold ${
                    health.upstreamStatus === 'reachable' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {health.upstreamStatus === 'reachable'
                    ? '● Connected & Reachable'
                    : '▲ Endpoint Degraded'}
                </span>
              ) : (
                <span className="text-slate-400">Pending</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => void runHealthCheck()}
              disabled={checking}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white text-slate-700 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} aria-hidden="true" />
              Verify /api/health
            </button>

            <div className="flex items-center gap-2">
              {sourceMode !== 'live' && (
                <button
                  type="button"
                  onClick={() => {
                    onSwitchToLive();
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-medium bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors cursor-pointer"
                >
                  Switch to Live NEA Data
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
