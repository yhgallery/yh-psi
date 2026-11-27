import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { getPm25BandLabel, NEA_PSI_BANDS, POLLUTANT_SPECS } from '../data/neaStandards';
import { RegionReading } from '../types/psi';

interface RegionInspectorProps {
  region: RegionReading;
}

export const RegionInspector: React.FC<RegionInspectorProps> = ({ region }) => {
  const bandMeta = NEA_PSI_BANDS[region.band];
  const pm25BandLabel = getPm25BandLabel(region.pollutants.pm25Hourly);

  return (
    <aside className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between h-full">
      <div>
        {/* Kicker & Coordinates */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
          <span>Selected Region</span>
          <span className="font-mono tabular-nums">
            {region.coordinates.lat.toFixed(3)}° N, {region.coordinates.lon.toFixed(3)}° E
          </span>
        </div>

        {/* Region Title + Explicit Band Status */}
        <div className="flex items-baseline justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {region.name} Singapore
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {region.stations.join(' · ')}
            </p>
          </div>
          <div className={`text-right shrink-0 ${bandMeta.textClass}`}>
            <span className="text-xs font-semibold inline-flex items-center gap-1">
              <span aria-hidden="true">{bandMeta.symbol}</span>
              {bandMeta.label}
            </span>
          </div>
        </div>

        {/* Primary Dual Metrics: 24-hr PSI + 1-hr PM2.5 */}
        <div className="grid grid-cols-2 gap-4 py-5 border-b border-slate-100">
          <div>
            <div className="text-xs text-slate-500 mb-1">24-hr PSI Index</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-mono font-bold tabular-nums text-slate-900">
                {region.psi24hr}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-mono tabular-nums font-medium ${
                  region.psi3hrDelta > 0
                    ? 'text-amber-700'
                    : region.psi3hrDelta < 0
                    ? 'text-emerald-700'
                    : 'text-slate-500'
                }`}
              >
                {region.psi3hrDelta > 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                ) : region.psi3hrDelta < 0 ? (
                  <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {region.psi3hrDelta > 0 ? `+${region.psi3hrDelta}` : region.psi3hrDelta} / 3h
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 mb-1">1-hr PM2.5</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-mono font-bold tabular-nums text-slate-900">
                {region.pollutants.pm25Hourly}
              </span>
              <span className="text-xs font-mono text-slate-500">µg/m³</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{pm25BandLabel}</div>
          </div>
        </div>

        {/* Six NEA Sub-Pollutant Telemetry Bars */}
        <div className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-900">Pollutant Breakdown</h4>
            <span className="text-xs text-slate-500">Sub-index Concentrations</span>
          </div>

          <div className="space-y-3.5">
            {POLLUTANT_SPECS.map((spec) => {
              const rawVal = region.pollutants[spec.key];
              const pct = Math.min(100, Math.max(4, (rawVal / spec.referenceMax) * 100));
              return (
                <div key={spec.key}>
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{spec.label}</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {rawVal}{' '}
                      <span className="font-normal text-slate-500">{spec.unit}</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: bandMeta.dotFill,
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{spec.guideline}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Regional Guidance Summary */}
      <div className={`mt-6 p-3.5 rounded-lg border ${bandMeta.surfaceClass} ${bandMeta.borderClass}`}>
        <div className={`text-xs font-semibold mb-1 ${bandMeta.textClass}`}>
          {bandMeta.label} Guidance ({bandMeta.rangeLabel} PSI)
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">{bandMeta.generalPublic}</p>
      </div>
    </aside>
  );
};
