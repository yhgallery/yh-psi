import React, { useMemo, useState } from 'react';
import { Compass, Layers, MapPin, Wind } from 'lucide-react';
import { NEA_BAND_ORDER, NEA_PSI_BANDS, REGION_ORDER } from '../data/neaStandards';
import { PsiSnapshot, RegionId } from '../types/psi';

interface SingaporePsiMapProps {
  snapshot: PsiSnapshot;
  selectedRegion: RegionId;
  onSelectRegion: (regionId: RegionId) => void;
}

const LON_MIN = 103.58;
const LON_MAX = 104.1;
const LAT_MIN = 1.19;
const LAT_MAX = 1.48;
const SVG_W = 920;
const SVG_H = 520;
const PAD_X = 40;
const PAD_Y = 35;

function project(lat: number, lon: number): [number, number] {
  const x = PAD_X + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (SVG_W - PAD_X * 2);
  const y = PAD_Y + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (SVG_H - PAD_Y * 2);
  return [Number(x.toFixed(1)), Number(y.toFixed(1))];
}

function unproject(x: number, y: number): { lat: number; lon: number } {
  const lon = LON_MIN + ((x - PAD_X) / (SVG_W - PAD_X * 2)) * (LON_MAX - LON_MIN);
  const lat = LAT_MAX - ((y - PAD_Y) / (SVG_H - PAD_Y * 2)) * (LAT_MAX - LAT_MIN);
  return {
    lat: Math.min(LAT_MAX, Math.max(LAT_MIN, lat)),
    lon: Math.min(LON_MAX, Math.max(LON_MIN, lon)),
  };
}

function toPolygonPath(coords: Array<[number, number]>): string {
  return (
    coords
      .map(([lat, lon], idx) => {
        const [x, y] = project(lat, lon);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ') + ' Z'
  );
}

// Authentic Singapore Main Island coastline coordinates (lat, lon)
const MAIN_ISLAND_COORDS: Array<[number, number]> = [
  [1.452, 103.768], // Woodlands Waterfront
  [1.465, 103.805], // Sembawang Park
  [1.469, 103.835], // Sembawang East
  [1.443, 103.852], // Yishun Dam / Simpang
  [1.425, 103.876], // Seletar North
  [1.418, 103.908], // Punggol Point
  [1.393, 103.938], // Pasir Ris Coast
  [1.392, 103.972], // Loyang
  [1.391, 104.002], // Changi Village
  [1.374, 104.022], // Changi Beach
  [1.351, 104.036], // Changi East Aviation Tip
  [1.318, 104.006], // Tanah Merah Ferry
  [1.311, 103.962], // Bedok / East Coast Park
  [1.298, 103.908], // Katong / Marine Parade
  [1.281, 103.872], // Marina East / Barrage
  [1.269, 103.856], // Marina South Pier
  [1.263, 103.822], // HarbourFront / Telok Blangah
  [1.267, 103.798], // Labrador Nature Reserve
  [1.281, 103.776], // Pasir Panjang Terminal
  [1.298, 103.748], // West Coast / Pandan
  [1.304, 103.708], // Jurong Port / Penjuru
  [1.296, 103.672], // Gul / Benoi
  [1.258, 103.642], // Tuas South Industrial
  [1.246, 103.621], // Tuas Tip South
  [1.289, 103.618], // Tuas View West
  [1.345, 103.635], // Tuas Checkpoint / Second Link
  [1.384, 103.672], // Tengah / Poyan Reservoir
  [1.424, 103.688], // Sungei Buloh West
  [1.446, 103.726], // Kranji Reservoir
];

const JURONG_ISLAND_COORDS: Array<[number, number]> = [
  [1.284, 103.694],
  [1.286, 103.722],
  [1.265, 103.736],
  [1.248, 103.702],
  [1.258, 103.668],
  [1.274, 103.669],
];

const SENTOSA_COORDS: Array<[number, number]> = [
  [1.258, 103.812],
  [1.257, 103.835],
  [1.246, 103.847],
  [1.241, 103.826],
  [1.248, 103.81],
];

const PULAU_UBIN_COORDS: Array<[number, number]> = [
  [1.418, 103.932],
  [1.421, 103.968],
  [1.409, 103.994],
  [1.399, 103.972],
  [1.402, 103.938],
];

const PULAU_TEKONG_COORDS: Array<[number, number]> = [
  [1.434, 104.018],
  [1.432, 104.062],
  [1.404, 104.072],
  [1.389, 104.042],
  [1.398, 104.014],
];

// Regional Voronoi-like zone boundaries clipped inside Singapore main island
const REGION_ZONE_POLYGONS: Record<RegionId, Array<[number, number]>> = {
  west: [
    [1.448, 103.62],
    [1.448, 103.758],
    [1.368, 103.768],
    [1.318, 103.762],
    [1.24, 103.755],
    [1.24, 103.61],
  ],
  north: [
    [1.475, 103.758],
    [1.475, 103.915],
    [1.395, 103.91],
    [1.388, 103.768],
  ],
  central: [
    [1.388, 103.768],
    [1.395, 103.91],
    [1.318, 103.895],
    [1.318, 103.762],
  ],
  east: [
    [1.42, 103.91],
    [1.42, 104.05],
    [1.29, 104.05],
    [1.29, 103.895],
  ],
  south: [
    [1.318, 103.762],
    [1.318, 103.895],
    [1.235, 103.895],
    [1.235, 103.755],
  ],
};

const TOWN_LANDMARKS: Array<{ name: string; lat: number; lon: number; align?: 'left' | 'right' }> = [
  { name: 'Tuas', lat: 1.315, lon: 103.638, align: 'right' },
  { name: 'Jurong West', lat: 1.341, lon: 103.704, align: 'right' },
  { name: 'Woodlands', lat: 1.438, lon: 103.786, align: 'right' },
  { name: 'Yishun', lat: 1.429, lon: 103.835, align: 'right' },
  { name: 'Bishan', lat: 1.351, lon: 103.848, align: 'right' },
  { name: 'Marina Bay', lat: 1.281, lon: 103.858, align: 'right' },
  { name: 'Tampines', lat: 1.354, lon: 103.944, align: 'right' },
  { name: 'Changi', lat: 1.364, lon: 103.992, align: 'left' },
  { name: 'Queenstown', lat: 1.295, lon: 103.802, align: 'left' },
];

export const SingaporePsiMap: React.FC<SingaporePsiMapProps> = ({
  snapshot,
  selectedRegion,
  onSelectRegion,
}) => {
  const [showWind, setShowWind] = useState(true);
  const [showTowns, setShowTowns] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number } | null>(null);

  const islandPaths = useMemo(
    () => ({
      main: toPolygonPath(MAIN_ISLAND_COORDS),
      jurong: toPolygonPath(JURONG_ISLAND_COORDS),
      sentosa: toPolygonPath(SENTOSA_COORDS),
      ubin: toPolygonPath(PULAU_UBIN_COORDS),
      tekong: toPolygonPath(PULAU_TEKONG_COORDS),
    }),
    []
  );

  const windAngleRad = ((snapshot.weather.windDirectionDeg - 90) * Math.PI) / 180;
  // Wind blowing FROM directionDeg -> TO directionDeg + 180
  const flowAngleDeg = (snapshot.weather.windDirectionDeg + 180) % 360;

  const windGridPoints = useMemo(
    () => [
      [1.43, 103.65],
      [1.43, 103.86],
      [1.43, 104.01],
      [1.33, 103.64],
      [1.33, 103.78],
      [1.33, 103.91],
      [1.33, 104.03],
      [1.24, 103.71],
      [1.24, 103.86],
      [1.24, 103.98],
    ],
    []
  );

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * SVG_W;
    const y = ((e.clientY - rect.top) / rect.height) * SVG_H;
    setCursorCoords(unproject(x, y));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Map Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg overflow-x-auto">
          {REGION_ORDER.map((rId) => {
            const r = snapshot.regions[rId];
            const isActive = selectedRegion === rId;
            return (
              <button
                key={rId}
                type="button"
                onClick={() => onSelectRegion(rId)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-600 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.name} <span className="font-mono tabular-nums ml-1 text-slate-500">{r.psi24hr}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowZones((v) => !v)}
            aria-pressed={showZones}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showZones
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            Zones
          </button>
          <button
            type="button"
            onClick={() => setShowWind((v) => !v)}
            aria-pressed={showWind}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showWind
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            <Wind className="w-3.5 h-3.5" aria-hidden="true" />
            Wind ({snapshot.weather.windCompass})
          </button>
          <button
            type="button"
            onClick={() => setShowTowns((v) => !v)}
            aria-pressed={showTowns}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showTowns
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            Towns
          </button>
        </div>
      </div>

      {/* Interactive Cartographic Canvas */}
      <div className="relative bg-slate-50">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-auto block cursor-crosshair select-none"
          role="img"
          aria-label="Interactive Singapore Regional PSI Map"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursorCoords(null)}
        >
          <defs>
            <clipPath id="sg-main-island-clip">
              <path d={islandPaths.main} />
            </clipPath>
            <pattern id="sg-grid" width="46" height="46" patternUnits="userSpaceOnUse">
              <path
                d="M 46 0 L 0 0 0 46"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="0.75"
                strokeDasharray="2 3"
              />
            </pattern>
            <marker
              id="wind-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569" fillOpacity="0.65" />
            </marker>
          </defs>

          {/* Maritime Background & Coordinate Grid */}
          <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="#F1F5F9" />
          <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#sg-grid)" />

          {/* Johor & Singapore Strait Labels */}
          <text
            x="230"
            y="48"
            className="fill-slate-400 text-[10px] font-mono tracking-widest uppercase"
          >
            Johor Strait
          </text>
          <text
            x="610"
            y="458"
            className="fill-slate-400 text-[10px] font-mono tracking-widest uppercase"
          >
            Singapore Strait
          </text>

          {/* Subtle Causeway & Second Link Bridges */}
          {(() => {
            const [cx1, cy1] = project(1.452, 103.769);
            const [cx2, cy2] = project(1.472, 103.767);
            const [sx1, sy1] = project(1.348, 103.635);
            const [sx2, sy2] = project(1.368, 103.615);
            return (
              <g stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round">
                <line x1={cx1} y1={cy1} x2={cx2} y2={cy2} />
                <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} />
              </g>
            );
          })()}

          {/* Singapore Base Landmasses */}
          <path
            d={islandPaths.main}
            fill="#FFFFFF"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d={islandPaths.jurong}
            fill="#FFFFFF"
            stroke="#94A3B8"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path
            d={islandPaths.sentosa}
            fill="#FFFFFF"
            stroke="#94A3B8"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path
            d={islandPaths.ubin}
            fill="#FFFFFF"
            stroke="#94A3B8"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path
            d={islandPaths.tekong}
            fill="#FFFFFF"
            stroke="#94A3B8"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />

          {/* Clipped Regional PSI Zone Overlays */}
          {showZones && (
            <g clipPath="url(#sg-main-island-clip)">
              {REGION_ORDER.map((rId) => {
                const reading = snapshot.regions[rId];
                const bandMeta = NEA_PSI_BANDS[reading.band];
                const isSelected = selectedRegion === rId;
                return (
                  <path
                    key={rId}
                    d={toPolygonPath(REGION_ZONE_POLYGONS[rId])}
                    fill={bandMeta.zoneFill}
                    fillOpacity={isSelected ? 0.95 : 0.65}
                    stroke={isSelected ? bandMeta.zoneStroke : '#CBD5E1'}
                    strokeWidth={isSelected ? 1.8 : 1}
                    strokeDasharray={isSelected ? undefined : '4 3'}
                    className="cursor-pointer transition-opacity duration-150 hover:fill-opacity-90"
                    onClick={() => onSelectRegion(rId)}
                  />
                );
              })}
            </g>
          )}

          {/* Central Catchment Reservoir Silhouettes for Cartographic Realism */}
          {(() => {
            const [mX, mY] = project(1.345, 103.828);
            const [pX, pY] = project(1.374, 103.813);
            const [kX, kY] = project(1.425, 103.733);
            return (
              <g fill="#E0F2FE" stroke="#BAE6FD" strokeWidth="0.9" pointerEvents="none">
                <ellipse cx={mX} cy={mY} rx="14" ry="6" transform={`rotate(-12 ${mX} ${mY})`} />
                <ellipse cx={pX} cy={pY} rx="12" ry="5" transform={`rotate(8 ${pX} ${pY})`} />
                <ellipse cx={kX} cy={kY} rx="8" ry="11" transform={`rotate(-18 ${kX} ${kY})`} />
              </g>
            );
          })()}

          {/* Town Reference Landmarks */}
          {showTowns &&
            TOWN_LANDMARKS.map((town) => {
              const [tx, ty] = project(town.lat, town.lon);
              return (
                <g key={town.name} pointerEvents="none">
                  <circle cx={tx} cy={ty} r="2" fill="#64748B" />
                  <text
                    x={town.align === 'left' ? tx - 6 : tx + 6}
                    y={ty + 3}
                    textAnchor={town.align === 'left' ? 'end' : 'start'}
                    className="fill-slate-500 text-[10px] font-medium"
                  >
                    {town.name}
                  </text>
                </g>
              );
            })}

          {/* Island Sub-labels */}
          {(() => {
            const [jx, jy] = project(1.264, 103.698);
            const [sx, sy] = project(1.249, 103.828);
            const [ux, uy] = project(1.409, 103.962);
            const [tkx, tky] = project(1.41, 104.043);
            return (
              <g pointerEvents="none" className="fill-slate-400 text-[9px] font-mono">
                <text x={jx} y={jy + 18} textAnchor="middle">
                  Jurong Is.
                </text>
                <text x={sx} y={sy + 14} textAnchor="middle">
                  Sentosa
                </text>
                <text x={ux} y={uy - 14} textAnchor="middle">
                  Pulau Ubin
                </text>
                <text x={tkx} y={tky - 20} textAnchor="middle">
                  Tekong
                </text>
              </g>
            );
          })()}

          {/* Wind Vector Streamlines */}
          {showWind &&
            windGridPoints.map(([lat, lon], i) => {
              const [wx, wy] = project(lat, lon);
              const rad = ((flowAngleDeg - 90) * Math.PI) / 180;
              const len = 28;
              const dx = Math.cos(rad) * len;
              const dy = Math.sin(rad) * len;
              return (
                <line
                  key={i}
                  x1={wx - dx / 2}
                  y1={wy - dy / 2}
                  x2={wx + dx / 2}
                  y2={wy + dy / 2}
                  stroke="#475569"
                  strokeOpacity="0.45"
                  strokeWidth="1.4"
                  markerEnd="url(#wind-arrow)"
                  pointerEvents="none"
                />
              );
            })}

          {/* Interactive 5-Region PSI Station Nodes */}
          {REGION_ORDER.map((rId) => {
            const reading = snapshot.regions[rId];
            const bandMeta = NEA_PSI_BANDS[reading.band];
            const isSelected = selectedRegion === rId;
            const [nx, ny] = project(reading.coordinates.lat, reading.coordinates.lon);

            return (
              <g
                key={rId}
                transform={`translate(${nx}, ${ny})`}
                role="button"
                tabIndex={0}
                aria-label={`${reading.name} Region: ${reading.psi24hr} PSI, ${bandMeta.label}`}
                className="cursor-pointer focus:outline-none"
                onClick={() => onSelectRegion(rId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectRegion(rId);
                  }
                }}
              >
                {/* Invisible 44px hit target */}
                <circle r="26" fill="transparent" />

                {/* Selection ring */}
                {isSelected && (
                  <rect
                    x="-46"
                    y="-24"
                    width="92"
                    height="48"
                    rx="10"
                    fill="none"
                    stroke="#0F172A"
                    strokeWidth="2"
                    strokeDasharray="3 2"
                  />
                )}

                {/* Station Telemetry Card Node */}
                <rect
                  x="-42"
                  y="-20"
                  width="84"
                  height="40"
                  rx="8"
                  fill={isSelected ? '#0F172A' : '#FFFFFF'}
                  stroke={isSelected ? '#0F172A' : bandMeta.dotFill}
                  strokeWidth={isSelected ? 2 : 1.5}
                />

                {/* Region Name */}
                <text
                  x="-32"
                  y="-4"
                  className={`text-[10px] font-semibold uppercase tracking-wide ${
                    isSelected ? 'fill-slate-300' : 'fill-slate-500'
                  }`}
                >
                  {reading.name}
                </text>

                {/* Numeric 24-hr PSI */}
                <text
                  x="-32"
                  y="13"
                  className={`text-[15px] font-mono font-bold tabular-nums ${
                    isSelected ? 'fill-white' : 'fill-slate-900'
                  }`}
                >
                  {reading.psi24hr}
                </text>

                {/* Band Glyph + Code */}
                <text
                  x="33"
                  y="12"
                  textAnchor="end"
                  fill={isSelected ? '#FFFFFF' : bandMeta.dotFill}
                  className="text-[11px] font-mono font-semibold"
                >
                  {bandMeta.symbol}
                </text>
              </g>
            );
          })}

          {/* Compass Rose in Top-Right of Canvas */}
          <g transform="translate(868, 44)" pointerEvents="none">
            <circle r="18" fill="#FFFFFF" fillOpacity="0.9" stroke="#CBD5E1" strokeWidth="1" />
            <text
              x="0"
              y="-6"
              textAnchor="middle"
              className="fill-slate-700 text-[9px] font-mono font-bold"
            >
              N
            </text>
            <g transform={`rotate(${snapshot.weather.windDirectionDeg})`}>
              <line x1="0" y1="9" x2="0" y2="-4" stroke="#0284C7" strokeWidth="1.5" />
              <polygon points="0,-9 -3,-3 3,-3" fill="#0284C7" />
            </g>
          </g>
        </svg>

        {/* Bottom-Left Live Coordinate HUD */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-white/95 border border-slate-200 rounded text-[11px] font-mono tabular-nums text-slate-600 pointer-events-none flex items-center gap-2">
          <Compass className="w-3 h-3 text-slate-400" aria-hidden="true" />
          {cursorCoords ? (
            <span>
              {cursorCoords.lat.toFixed(4)}° N, {cursorCoords.lon.toFixed(4)}° E
            </span>
          ) : (
            <span>1.3521° N, 103.8198° E · Singapore Grid</span>
          )}
        </div>
      </div>

      {/* NEA Official PSI Scale Legend */}
      <div className="px-5 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-500">NEA 24-hr PSI Scale</span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {NEA_BAND_ORDER.map((bandId) => {
            const band = NEA_PSI_BANDS[bandId];
            return (
              <div key={bandId} className="inline-flex items-center gap-1.5 text-slate-700">
                <span style={{ color: band.dotFill }} aria-hidden="true" className="text-xs">
                  {band.symbol}
                </span>
                <span className="font-medium">{band.label}</span>
                <span className="font-mono tabular-nums text-slate-500">({band.rangeLabel})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
