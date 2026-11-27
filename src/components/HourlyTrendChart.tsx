import React, { useMemo, useState } from 'react';
import { REGION_ORDER } from '../data/neaStandards';
import { PsiSnapshot, RegionId } from '../types/psi';

interface HourlyTrendChartProps {
  snapshot: PsiSnapshot;
  selectedRegion: RegionId;
  onSelectRegion: (regionId: RegionId) => void;
}

type ChartMetric = 'psi' | 'pm25';

const REGION_COLORS: Record<RegionId, string> = {
  west: '#D97706', // Amber
  south: '#0284C7', // Sky
  central: '#0F172A', // Deep Slate
  north: '#059669', // Emerald
  east: '#7C3AED', // Violet
};

const CHART_W = 820;
const CHART_H = 290;
const MARGIN = { top: 24, right: 24, bottom: 34, left: 44 };

export const HourlyTrendChart: React.FC<HourlyTrendChartProps> = ({
  snapshot,
  selectedRegion,
  onSelectRegion,
}) => {
  const [metric, setMetric] = useState<ChartMetric>('psi');
  const [visibleRegions, setVisibleRegions] = useState<Record<RegionId, boolean>>({
    north: true,
    central: true,
    east: true,
    west: true,
    south: true,
  });
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const history = snapshot.hourlyHistory;
  const innerW = CHART_W - MARGIN.left - MARGIN.right;
  const innerH = CHART_H - MARGIN.top - MARGIN.bottom;

  const yMax = useMemo(() => {
    let peak = metric === 'psi' ? 120 : 80;
    for (const pt of history) {
      for (const rId of REGION_ORDER) {
        const val = pt[metric][rId];
        if (val > peak) peak = val;
      }
    }
    return Math.ceil((peak + 20) / 50) * 50;
  }, [history, metric]);

  const xScale = (idx: number) =>
    MARGIN.left + (idx / Math.max(1, history.length - 1)) * innerW;

  const yScale = (val: number) =>
    MARGIN.top + innerH - (Math.min(yMax, Math.max(0, val)) / yMax) * innerH;

  const thresholds =
    metric === 'psi'
      ? [
          { value: 50, label: '50 · Good', color: '#059669' },
          { value: 100, label: '100 · Moderate', color: '#0284C7' },
          { value: 200, label: '200 · Unhealthy', color: '#D97706' },
        ]
      : [
          { value: 55, label: '55 µg/m³ · Band I', color: '#059669' },
          { value: 150, label: '150 µg/m³ · Band II', color: '#D97706' },
        ];

  const activeIndex = hoverIdx !== null ? hoverIdx : history.length - 1;
  const activePoint = history[activeIndex];

  const toggleRegionVisibility = (rId: RegionId) => {
    const activeCount = REGION_ORDER.filter((id) => visibleRegions[id]).length;
    if (visibleRegions[rId] && activeCount === 1) return;
    setVisibleRegions((prev) => ({ ...prev, [rId]: !prev[rId] }));
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * CHART_W - MARGIN.left;
    const ratio = Math.min(1, Math.max(0, relX / innerW));
    const idx = Math.round(ratio * (history.length - 1));
    setHoverIdx(idx);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            24-Hour Regional Trajectory
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Hourly readings across all 5 NEA monitoring sectors ({history[0]?.hourLabel} –{' '}
            {history[history.length - 1]?.hourLabel} SGT)
          </p>
        </div>

        {/* Metric Segmented Switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
          <button
            type="button"
            onClick={() => setMetric('psi')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              metric === 'psi'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            24-hr PSI
          </button>
          <button
            type="button"
            onClick={() => setMetric('pm25')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              metric === 'pm25'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1-hr PM2.5 (µg/m³)
          </button>
        </div>
      </div>

      {/* Interactive Region Filter & Crosshair Readout Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-xs border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          {REGION_ORDER.map((rId) => {
            const visible = visibleRegions[rId];
            const isSelected = selectedRegion === rId;
            return (
              <button
                key={rId}
                type="button"
                onClick={() => {
                  toggleRegionVisibility(rId);
                  onSelectRegion(rId);
                }}
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  visible
                    ? isSelected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                <span
                  className="w-2.5 h-0.5 rounded-full"
                  style={{ backgroundColor: visible ? REGION_COLORS[rId] : '#CBD5E1' }}
                />
                <span>{snapshot.regions[rId].name}</span>
                {activePoint && (
                  <span className="font-mono tabular-nums">
                    {activePoint[metric][rId]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activePoint && (
          <div className="font-mono tabular-nums text-slate-500">
            {hoverIdx !== null ? `Sample @ ${activePoint.hourLabel} SGT` : `Latest @ ${activePoint.hourLabel} SGT`}
          </div>
        )}
      </div>

      {/* SVG Multi-Line Chart */}
      <div className="pt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full min-w-[560px] h-auto block cursor-crosshair"
          role="img"
          aria-label="24-hour PSI and PM2.5 multi-region line chart"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Horizontal Y-Axis Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const val = Math.round(yMax * frac);
            const y = yScale(val);
            return (
              <g key={frac}>
                <line
                  x1={MARGIN.left}
                  y1={y}
                  x2={CHART_W - MARGIN.right}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <text
                  x={MARGIN.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono tabular-nums"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Official NEA Threshold Reference Lines */}
          {thresholds.map((t) => {
            if (t.value > yMax) return null;
            const ty = yScale(t.value);
            return (
              <g key={t.value}>
                <line
                  x1={MARGIN.left}
                  y1={ty}
                  x2={CHART_W - MARGIN.right}
                  y2={ty}
                  stroke={t.color}
                  strokeOpacity="0.45"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={CHART_W - MARGIN.right - 4}
                  y={ty - 4}
                  textAnchor="end"
                  fill={t.color}
                  className="text-[10px] font-mono"
                >
                  {t.label}
                </text>
              </g>
            );
          })}

          {/* X-Axis Time Labels */}
          {history.map((pt, idx) => {
            if (idx % 3 !== 0 && idx !== history.length - 1) return null;
            const x = xScale(idx);
            return (
              <text
                key={pt.timestampIso}
                x={x}
                y={CHART_H - 10}
                textAnchor="middle"
                className="fill-slate-400 text-[10px] font-mono tabular-nums"
              >
                {pt.hourLabel}
              </text>
            );
          })}

          {/* Region Curves */}
          {REGION_ORDER.map((rId) => {
            if (!visibleRegions[rId]) return null;
            const isSelected = selectedRegion === rId;
            const pathD = history
              .map((pt, idx) => {
                const x = xScale(idx);
                const y = yScale(pt[metric][rId]);
                return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
              })
              .join(' ');

            return (
              <path
                key={rId}
                d={pathD}
                fill="none"
                stroke={REGION_COLORS[rId]}
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeOpacity={isSelected ? 1 : 0.72}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Active Hover Crosshair & Nodes */}
          {activePoint && (
            <g pointerEvents="none">
              <line
                x1={xScale(activeIndex)}
                y1={MARGIN.top}
                x2={xScale(activeIndex)}
                y2={CHART_H - MARGIN.bottom}
                stroke="#94A3B8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {REGION_ORDER.map((rId) => {
                if (!visibleRegions[rId]) return null;
                return (
                  <circle
                    key={rId}
                    cx={xScale(activeIndex)}
                    cy={yScale(activePoint[metric][rId])}
                    r={selectedRegion === rId ? 4.5 : 3}
                    fill="#FFFFFF"
                    stroke={REGION_COLORS[rId]}
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
