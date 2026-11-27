import React, { useEffect, useState } from 'react';
import { NEA_BAND_ORDER, NEA_PSI_BANDS } from '../data/neaStandards';
import { PsiBandId } from '../types/psi';

interface HealthAdvisorySectionProps {
  activePeakBand: PsiBandId;
  peakPsi: number;
  peakRegionName: string;
}

export const HealthAdvisorySection: React.FC<HealthAdvisorySectionProps> = ({
  activePeakBand,
  peakPsi,
  peakRegionName,
}) => {
  const [inspectedBand, setInspectedBand] = useState<PsiBandId>(activePeakBand);

  useEffect(() => {
    setInspectedBand(activePeakBand);
  }, [activePeakBand]);

  const band = NEA_PSI_BANDS[inspectedBand];
  const isCurrentActive = inspectedBand === activePeakBand;

  return (
    <section id="advisory" className="scroll-mt-20">
      <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="text-xs text-slate-500 mb-1">
              Singapore MOH &amp; NEA Health Advisory · Peak Island Reading {peakPsi} PSI ({peakRegionName})
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Public Health &amp; Activity Guidance
            </h2>
          </div>

          {/* Interactive NEA Band Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
            {NEA_BAND_ORDER.map((bId) => {
              const meta = NEA_PSI_BANDS[bId];
              const isSelected = inspectedBand === bId;
              const isLivePeak = activePeakBand === bId;
              return (
                <button
                  key={bId}
                  type="button"
                  onClick={() => setInspectedBand(bId)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span style={{ color: meta.dotFill }} aria-hidden="true" className="mr-1.5">
                    {meta.symbol}
                  </span>
                  {meta.label}
                  {isLivePeak ? ' (Active)' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Band Summary Strip */}
        <div className="py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className={`text-sm font-bold ${band.textClass}`}>
              {band.symbol} {band.label} Band ({band.rangeLabel} PSI)
            </span>
            <span className="text-sm text-slate-600">{band.summary}</span>
          </div>
          {isCurrentActive && (
            <span className="text-xs font-medium text-slate-500">
              Matches current peak reading across Singapore
            </span>
          )}
        </div>

        {/* 4-Column Advisory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              General Public
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed">{band.generalPublic}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Vulnerable Groups
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed">{band.vulnerableGroups}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Mask &amp; Air Filtration
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed">{band.maskGuidance}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Schools &amp; Workplaces
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed">{band.schoolsAndWork}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
