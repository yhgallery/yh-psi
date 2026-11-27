import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import { NEA_PSI_BANDS, REGION_ORDER } from '../data/neaStandards';
import { PsiBandId, PsiSnapshot, RegionId } from '../types/psi';

interface RegionalMatrixTableProps {
  snapshot: PsiSnapshot;
  selectedRegion: RegionId;
  onSelectRegion: (regionId: RegionId) => void;
}

type SortKey = 'name' | 'psi24hr' | 'pm25Hourly' | 'pm10';

export const RegionalMatrixTable: React.FC<RegionalMatrixTableProps> = ({
  snapshot,
  selectedRegion,
  onSelectRegion,
}) => {
  const [query, setQuery] = useState('');
  const [bandFilter, setBandFilter] = useState<'all' | PsiBandId>('all');
  const [sortKey, setSortKey] = useState<SortKey>('psi24hr');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(key === 'name');
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = REGION_ORDER.map((id) => snapshot.regions[id]).filter((r) => {
      const matchesBand = bandFilter === 'all' || r.band === bandFilter;
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.stations.some((s) => s.toLowerCase().includes(q));
      return matchesBand && matchesQuery;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'psi24hr') cmp = a.psi24hr - b.psi24hr;
      else if (sortKey === 'pm25Hourly') cmp = a.pollutants.pm25Hourly - b.pollutants.pm25Hourly;
      else if (sortKey === 'pm10') cmp = a.pollutants.pm10 - b.pollutants.pm10;
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [snapshot, query, bandFilter, sortKey, sortAsc]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Regional Monitoring Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select any region row to inspect sub-index distribution on the island map
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter town or region..."
              aria-label="Filter town or region"
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 w-48"
            />
          </div>

          {/* Band Filter */}
          <select
            value={bandFilter}
            onChange={(e) => setBandFilter(e.target.value as 'all' | PsiBandId)}
            aria-label="Filter by PSI Band"
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-slate-400 cursor-pointer"
          >
            <option value="all">All Bands</option>
            <option value="good">Good (0–50)</option>
            <option value="moderate">Moderate (51–100)</option>
            <option value="unhealthy">Unhealthy (101–200)</option>
            <option value="very-unhealthy">Very Unhealthy (201–300)</option>
            <option value="hazardous">Hazardous (&gt;300)</option>
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-700">No monitoring regions match your filter.</p>
          <p className="text-xs text-slate-500 mt-1">
            Clear the town search or reset the PSI band filter to view all 5 Singapore regions.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setBandFilter('all');
            }}
            className="mt-4 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                <th className="py-2.5 px-6">
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                  >
                    Region &amp; Towns <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="py-2.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('psi24hr')}
                    className="inline-flex items-center justify-end gap-1 hover:text-slate-900 cursor-pointer ml-auto"
                  >
                    24-hr PSI <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="py-2.5 px-4 text-right">3-hr Trend</th>
                <th className="py-2.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('pm25Hourly')}
                    className="inline-flex items-center justify-end gap-1 hover:text-slate-900 cursor-pointer ml-auto"
                  >
                    1-hr PM2.5 <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="py-2.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('pm10')}
                    className="inline-flex items-center justify-end gap-1 hover:text-slate-900 cursor-pointer ml-auto"
                  >
                    PM10 <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="py-2.5 px-4 text-right">O₃</th>
                <th className="py-2.5 px-4 text-right">SO₂</th>
                <th className="py-2.5 px-6 text-right">Band Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rows.map((r) => {
                const bandMeta = NEA_PSI_BANDS[r.band];
                const isSelected = r.id === selectedRegion;
                return (
                  <tr
                    key={r.id}
                    onClick={() => onSelectRegion(r.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-sky-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-6">
                      <div className="font-semibold text-slate-900">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.stations.join(' · ')}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                      {r.psi24hr}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono tabular-nums text-xs font-medium ${
                        r.psi3hrDelta > 0
                          ? 'text-amber-700'
                          : r.psi3hrDelta < 0
                          ? 'text-emerald-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {r.psi3hrDelta > 0 ? `+${r.psi3hrDelta}` : r.psi3hrDelta}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {r.pollutants.pm25Hourly} <span className="text-xs text-slate-400">µg/m³</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {r.pollutants.pm10} <span className="text-xs text-slate-400">µg/m³</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {r.pollutants.o3} <span className="text-xs text-slate-400">µg/m³</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {r.pollutants.so2} <span className="text-xs text-slate-400">µg/m³</span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${bandMeta.textClass}`}>
                        <span aria-hidden="true">{bandMeta.symbol}</span>
                        {bandMeta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
