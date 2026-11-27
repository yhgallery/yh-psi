import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ApiAdapterModal } from './components/ApiAdapterModal';
import { HealthAdvisorySection } from './components/HealthAdvisorySection';
import { HourlyTrendChart } from './components/HourlyTrendChart';
import { RegionalMatrixTable } from './components/RegionalMatrixTable';
import { RegionInspector } from './components/RegionInspector';
import { SingaporePsiMap } from './components/SingaporePsiMap';
import { getPm25BandLabel, getPsiBand, NEA_PSI_BANDS, REGION_ORDER } from './data/neaStandards';
import { liveNeaProvider } from './services/psiLiveProvider';
import { createSnapshot, PSI_SCENARIOS } from './services/psiMockProvider';
import { PsiSnapshot, RegionId, ScenarioId } from './types/psi';

type SourceMode = 'live' | 'simulation';

export default function App() {
  const [sourceMode, setSourceMode] = useState<SourceMode>('live');
  const [scenarioId, setScenarioId] = useState<ScenarioId>('moderate');
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('west');
  const [liveDriftEnabled, setLiveDriftEnabled] = useState<boolean>(false);
  const [driftMap, setDriftMap] = useState<Partial<Record<RegionId, number>>>({});
  const [snapshot, setSnapshot] = useState<PsiSnapshot>(() => createSnapshot('baseline'));
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  const loadLiveSnapshot = useCallback(async () => {
    setIsLoadingLive(true);
    setLiveError(null);
    try {
      const liveData = await liveNeaProvider.fetchSnapshot();
      setSnapshot(liveData);
    } catch (err) {
      setLiveError(
        err instanceof Error ? err.message : 'Unable to fetch live PSI readings from /api/psi.'
      );
    } finally {
      setIsLoadingLive(false);
    }
  }, []);

  // Fetch live data when in live mode (initial load + every 5 minutes)
  useEffect(() => {
    if (sourceMode !== 'live') return;
    void loadLiveSnapshot();
    const poll = window.setInterval(() => {
      void loadLiveSnapshot();
    }, 300000);
    return () => window.clearInterval(poll);
  }, [sourceMode, loadLiveSnapshot]);

  // Sync simulation snapshot whenever scenario or drift updates in simulation mode
  useEffect(() => {
    if (sourceMode !== 'simulation') return;
    setSnapshot(createSnapshot(scenarioId, driftMap));
  }, [sourceMode, scenarioId, driftMap]);

  // Optional frontend drift simulation when in simulation mode
  useEffect(() => {
    if (sourceMode !== 'simulation' || !liveDriftEnabled) return;
    const timer = window.setInterval(() => {
      setDriftMap((prev) => {
        const next: Partial<Record<RegionId, number>> = { ...prev };
        for (const rId of REGION_ORDER) {
          const current = prev[rId] ?? 0;
          const step = Math.round((Math.random() - 0.48) * 2);
          next[rId] = Math.max(-4, Math.min(4, current + step));
        }
        return next;
      });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [sourceMode, liveDriftEnabled]);

  const handleSelectLiveMode = () => {
    setSourceMode('live');
  };

  const handleScenarioChange = (nextScenario: ScenarioId) => {
    setSourceMode('simulation');
    setScenarioId(nextScenario);
    setDriftMap({});
  };

  const handleManualRefresh = () => {
    if (sourceMode === 'live') {
      void loadLiveSnapshot();
      return;
    }
    setDriftMap((prev) => {
      const next: Partial<Record<RegionId, number>> = {};
      for (const rId of REGION_ORDER) {
        const current = prev[rId] ?? 0;
        const step = Math.round((Math.random() - 0.5) * 3);
        next[rId] = Math.max(-4, Math.min(4, current + step));
      }
      return next;
    });
  };

  const summary = useMemo(() => {
    const list = REGION_ORDER.map((id) => snapshot.regions[id]);
    const psiValues = list.map((r) => r.psi24hr);
    const pm25Values = list.map((r) => r.pollutants.pm25Hourly);
    const minPsi = Math.min(...psiValues);
    const maxPsi = Math.max(...psiValues);
    const minPm25 = Math.min(...pm25Values);
    const maxPm25 = Math.max(...pm25Values);

    const peakRegion = list.reduce((best, cur) => (cur.psi24hr > best.psi24hr ? cur : best), list[0]);
    const peakBandId = getPsiBand(maxPsi);
    const peakBand = NEA_PSI_BANDS[peakBandId];

    return {
      minPsi,
      maxPsi,
      minPm25,
      maxPm25,
      peakRegion,
      peakBandId,
      peakBand,
      pm25Descriptor: getPm25BandLabel(maxPm25),
    };
  }, [snapshot]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Wordmark */}
          <a
            href="#overview"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            SG HazeWatch
          </a>

          {/* Zone 2: 4 Single-line Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#overview"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Overview
            </a>
            <a
              href="#map"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Regional Map
            </a>
            <a
              href="#trends"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              24h Trends
            </a>
            <a
              href="#advisory"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Health Guide
            </a>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsApiModalOpen(true)}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              API Status
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8 space-y-10">
        {/* Section 1: Overview & National KPI Strip */}
        <section id="overview" className="scroll-mt-20 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                <span>Singapore 5-Region Air Quality Grid</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {isLoadingLive && sourceMode === 'live'
                    ? 'Syncing data.gov.sg...'
                    : `Updated ${snapshot.updatedAtSgt}`}
                </span>
                <span aria-hidden="true">·</span>
                <span>{snapshot.sourceLabel}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight text-balance">
                Singapore PSI &amp; Haze Telemetry
              </h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {snapshot.weather.monsoonNote}
              </p>
            </div>

            {/* Workspace Data Source & Scenario Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div
                className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg"
                role="group"
                aria-label="PSI Data Source and Haze Scenarios"
              >
                <button
                  type="button"
                  onClick={handleSelectLiveMode}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    sourceMode === 'live'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Live NEA API
                </button>
                {PSI_SCENARIOS.map((sc) => {
                  const active = sourceMode === 'simulation' && scenarioId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => handleScenarioChange(sc.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {sc.label}
                    </button>
                  );
                })}
              </div>

              {sourceMode === 'simulation' && (
                <button
                  type="button"
                  onClick={() => setLiveDriftEnabled((v) => !v)}
                  aria-pressed={liveDriftEnabled}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    liveDriftEnabled
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {liveDriftEnabled ? 'Live Drift: On' : 'Live Drift: Off'}
                </button>
              )}

              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isLoadingLive && sourceMode === 'live'}
                aria-label="Refresh PSI readings"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white text-slate-700 border border-slate-200 rounded-lg hover:border-slate-300 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isLoadingLive && sourceMode === 'live' ? 'animate-spin' : ''
                  }`}
                  aria-hidden="true"
                />
                Refresh
              </button>
            </div>
          </div>

          {liveError && sourceMode === 'live' && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900"
            >
              <span>
                Live data.gov.sg connection encountered an error: {liveError}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void loadLiveSnapshot()}
                  className="px-3 py-1.5 font-medium bg-white border border-amber-300 rounded-md hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  Retry Live Sync
                </button>
                <button
                  type="button"
                  onClick={() => handleScenarioChange('moderate')}
                  className="px-3 py-1.5 font-medium bg-amber-900 text-white rounded-md hover:bg-amber-800 transition-colors cursor-pointer"
                >
                  Use Scenario Preset
                </button>
              </div>
            </div>
          )}

          {/* Full-Width 4-Column Summary KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500 mb-2">National 24-hr PSI Range</div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-3xl font-mono font-bold tabular-nums text-slate-900">
                  {summary.minPsi}–{summary.maxPsi}
                </div>
                <span className={`text-xs font-semibold ${summary.peakBand.textClass}`}>
                  {summary.peakBand.symbol} {summary.peakBand.label}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Across North, South, East, West &amp; Central
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500 mb-2">Peak Regional Reading</div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-3xl font-mono font-bold tabular-nums text-slate-900">
                  {summary.peakRegion.psi24hr}{' '}
                  <span className="text-xs font-sans font-medium text-slate-500">PSI</span>
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  {summary.peakRegion.name}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                {summary.peakRegion.stations.slice(0, 3).join(' · ')}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500 mb-2">PM2.5 Concentration</div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-3xl font-mono font-bold tabular-nums text-slate-900">
                  {summary.minPm25}–{summary.maxPm25}
                  <span className="text-xs font-mono font-normal text-slate-500 ml-1">µg/m³</span>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-2">{summary.pm25Descriptor}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500 mb-2">Prevailing Wind &amp; Visibility</div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-3xl font-mono font-bold tabular-nums text-slate-900">
                  {snapshot.weather.windCompass}{' '}
                  <span className="text-xl font-semibold text-slate-700">
                    {snapshot.weather.windSpeedKmh}
                  </span>
                  <span className="text-xs font-mono font-normal text-slate-500 ml-1">km/h</span>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-600">
                  {snapshot.weather.visibilityKm.toFixed(1)} km vis
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2 font-mono tabular-nums">
                {snapshot.weather.temperatureC.toFixed(1)}°C · {snapshot.weather.humidityPct}% RH
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Interactive Singapore Map & Selected Region Inspector */}
        <section id="map" className="scroll-mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-8">
              <SingaporePsiMap
                snapshot={snapshot}
                selectedRegion={selectedRegion}
                onSelectRegion={setSelectedRegion}
              />
            </div>
            <div className="lg:col-span-4">
              <RegionInspector region={snapshot.regions[selectedRegion]} />
            </div>
          </div>
        </section>

        {/* Section 3: 24-Hour Trajectory & 5-Region Data Matrix */}
        <section id="trends" className="scroll-mt-20 space-y-6">
          <HourlyTrendChart
            snapshot={snapshot}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
          />
          <RegionalMatrixTable
            snapshot={snapshot}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
          />
        </section>

        {/* Section 4: NEA Health Advisory */}
        <HealthAdvisorySection
          activePeakBand={summary.peakBandId}
          peakPsi={summary.peakRegion.psi24hr}
          peakRegionName={summary.peakRegion.name}
        />
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1360px] mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            SG HazeWatch · Calibrated to Singapore NEA PSI &amp; data.gov.sg v2 Real-Time API
          </div>
          <button
            type="button"
            onClick={() => setIsApiModalOpen(true)}
            className="text-slate-700 hover:text-slate-900 font-medium hover:underline underline-offset-4 cursor-pointer"
          >
            Inspect Serverless API
          </button>
        </div>
      </footer>

      <ApiAdapterModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        sourceMode={sourceMode}
        onSwitchToLive={handleSelectLiveMode}
      />
    </div>
  );
}
