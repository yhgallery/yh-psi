import { getPsiBand, REGION_ORDER } from '../data/neaStandards';
import {
  HourlyPoint,
  PsiDataProvider,
  PsiSnapshot,
  RegionId,
  RegionReading,
  ScenarioId,
  WeatherContext,
} from '../types/psi';

export interface ScenarioMeta {
  id: ScenarioId;
  label: string;
  shortTag: string;
  description: string;
}

export const PSI_SCENARIOS: ScenarioMeta[] = [
  {
    id: 'baseline',
    label: 'Clear Baseline',
    shortTag: '34–46 PSI',
    description: 'Typical inter-monsoon afternoon with clean maritime air.',
  },
  {
    id: 'moderate',
    label: 'Light Haze',
    shortTag: '68–86 PSI',
    description: 'Light southwesterly drift bringing moderate haze over western & southern corridors.',
  },
  {
    id: 'unhealthy',
    label: 'Transboundary Alert',
    shortTag: '118–146 PSI',
    description: 'Active Sumatra hotspot smoke carried across the Strait of Malacca.',
  },
  {
    id: 'severe',
    label: 'Severe Episode',
    shortTag: '204–238 PSI',
    description: 'Dense stagnant plume affecting visibility island-wide.',
  },
];

interface RegionSeed {
  id: RegionId;
  name: string;
  stations: string[];
  lat: number;
  lon: number;
}

const REGION_SEEDS: Record<RegionId, RegionSeed> = {
  north: {
    id: 'north',
    name: 'North',
    stations: ['Woodlands', 'Yishun', 'Sembawang', 'Mandai'],
    lat: 1.41803,
    lon: 103.82,
  },
  central: {
    id: 'central',
    name: 'Central',
    stations: ['Toa Payoh', 'Bishan', 'Orchard', 'Marina Bay'],
    lat: 1.35735,
    lon: 103.82,
  },
  east: {
    id: 'east',
    name: 'East',
    stations: ['Tampines', 'Pasir Ris', 'Changi', 'Bedok'],
    lat: 1.35735,
    lon: 103.94,
  },
  west: {
    id: 'west',
    name: 'West',
    stations: ['Jurong West', 'Tuas', 'Boon Lay', 'Bukit Batok'],
    lat: 1.35735,
    lon: 103.7,
  },
  south: {
    id: 'south',
    name: 'South',
    stations: ['Queenstown', 'Bukit Merah', 'HarbourFront', 'Sentosa'],
    lat: 1.29587,
    lon: 103.82,
  },
};

interface ScenarioConfig {
  psiTargets: Record<RegionId, number>;
  deltas: Record<RegionId, number>;
  pm25Targets: Record<RegionId, number>;
  weather: WeatherContext;
  waveBias: number[];
}

const SCENARIO_CONFIGS: Record<ScenarioId, ScenarioConfig> = {
  baseline: {
    psiTargets: { west: 46, south: 42, central: 39, north: 36, east: 34 },
    deltas: { west: 2, south: 1, central: -1, north: -2, east: -1 },
    pm25Targets: { west: 18, south: 15, central: 14, north: 12, east: 11 },
    weather: {
      windDirectionDeg: 145,
      windCompass: 'SE',
      windSpeedKmh: 15,
      visibilityKm: 18.4,
      humidityPct: 76,
      temperatureC: 30.2,
      monsoonNote: 'Southeast breeze keeping Straits maritime air clean across Changi and Marina Bay.',
    },
    waveBias: [-4, -5, -5, -4, -3, -2, 0, 2, 3, 4, 4, 3, 2, 1, 2, 3, 2, 1, 0, -1, -1, 0, 0, 0],
  },
  moderate: {
    psiTargets: { west: 86, south: 81, central: 76, north: 72, east: 68 },
    deltas: { west: 7, south: 5, central: 4, north: 2, east: 1 },
    pm25Targets: { west: 42, south: 38, central: 34, north: 31, east: 27 },
    weather: {
      windDirectionDeg: 220,
      windCompass: 'SW',
      windSpeedKmh: 12,
      visibilityKm: 9.2,
      humidityPct: 68,
      temperatureC: 31.8,
      monsoonNote: 'Light southwesterly flow advecting dispersed smoke toward Tuas and Jurong.',
    },
    waveBias: [-14, -13, -12, -10, -8, -6, -4, -1, 2, 5, 7, 8, 9, 10, 9, 8, 6, 5, 4, 3, 2, 1, 0, 0],
  },
  unhealthy: {
    psiTargets: { west: 146, south: 139, central: 131, north: 124, east: 118 },
    deltas: { west: 14, south: 11, central: 9, north: 6, east: 5 },
    pm25Targets: { west: 108, south: 99, central: 89, north: 82, east: 74 },
    weather: {
      windDirectionDeg: 235,
      windCompass: 'WSW',
      windSpeedKmh: 9,
      visibilityKm: 4.1,
      humidityPct: 62,
      temperatureC: 32.6,
      monsoonNote: 'Persistent WSW monsoon corridor transporting dense Sumatra particulate plume.',
    },
    waveBias: [-28, -26, -24, -20, -17, -14, -10, -6, -2, 2, 6, 10, 14, 15, 13, 11, 9, 7, 5, 4, 3, 2, 1, 0],
  },
  severe: {
    psiTargets: { west: 238, south: 229, central: 218, north: 211, east: 204 },
    deltas: { west: 22, south: 19, central: 16, north: 12, east: 10 },
    pm25Targets: { west: 212, south: 196, central: 184, north: 171, east: 158 },
    weather: {
      windDirectionDeg: 245,
      windCompass: 'WSW',
      windSpeedKmh: 6,
      visibilityKm: 1.8,
      humidityPct: 58,
      temperatureC: 33.4,
      monsoonNote: 'Low wind shear trapping dense transboundary particulates across all 5 regions.',
    },
    waveBias: [-42, -39, -36, -33, -29, -25, -20, -14, -9, -4, 1, 6, 11, 16, 18, 15, 12, 9, 7, 5, 4, 2, 1, 0],
  },
};

function buildPollutants(psi: number, pm25Hourly: number) {
  const ratio = psi / 50;
  return {
    pm25Hourly: Math.max(5, Math.round(pm25Hourly)),
    pm25SubIndex: Math.max(6, Math.round(pm25Hourly * 0.88)),
    pm10: Math.max(12, Math.round(psi * 0.94 + 14)),
    o3: Math.max(18, Math.round(28 + ratio * 21)),
    so2: Math.max(4, Math.round(7 + ratio * 11)),
    no2: Math.max(12, Math.round(22 + ratio * 18)),
    co: Number((0.35 + ratio * 0.55).toFixed(2)),
  };
}

function formatSgtTime(date: Date): string {
  return new Intl.DateTimeFormat('en-SG', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function buildHourlyHistory(
  scenarioId: ScenarioId,
  now: Date,
  driftByRegion: Record<RegionId, number>
): HourlyPoint[] {
  const cfg = SCENARIO_CONFIGS[scenarioId];
  const points: HourlyPoint[] = [];

  for (let i = 23; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourIdx = 23 - i;
    const bias = cfg.waveBias[hourIdx] ?? 0;

    const psi = {} as Record<RegionId, number>;
    const pm25 = {} as Record<RegionId, number>;

    for (const regionId of REGION_ORDER) {
      const regionOffset =
        regionId === 'west' ? 2 : regionId === 'east' ? -2 : regionId === 'south' ? 1 : 0;
      const isCurrent = i === 0;
      const drift = isCurrent ? driftByRegion[regionId] : Math.round(Math.sin(hourIdx * 0.9 + regionOffset) * 2);
      const valPsi = Math.max(12, Math.round(cfg.psiTargets[regionId] + bias + drift));
      const valPm25 = Math.max(5, Math.round(cfg.pm25Targets[regionId] + bias * 0.72 + drift));
      psi[regionId] = valPsi;
      pm25[regionId] = valPm25;
    }

    points.push({
      hourLabel: `${formatSgtTime(t).slice(0, 2)}:00`,
      timestampIso: t.toISOString(),
      psi,
      pm25,
    });
  }

  return points;
}

export function createSnapshot(
  scenarioId: ScenarioId = 'moderate',
  driftOffset: Partial<Record<RegionId, number>> = {}
): PsiSnapshot {
  const cfg = SCENARIO_CONFIGS[scenarioId];
  const now = new Date();

  const driftByRegion: Record<RegionId, number> = {
    north: driftOffset.north ?? 0,
    south: driftOffset.south ?? 0,
    east: driftOffset.east ?? 0,
    west: driftOffset.west ?? 0,
    central: driftOffset.central ?? 0,
  };

  const regions = {} as Record<RegionId, RegionReading>;
  for (const regionId of REGION_ORDER) {
    const seed = REGION_SEEDS[regionId];
    const psi24hr = Math.max(10, Math.round(cfg.psiTargets[regionId] + driftByRegion[regionId]));
    const pm25Hourly = Math.max(
      4,
      Math.round(cfg.pm25Targets[regionId] + driftByRegion[regionId] * 0.85)
    );
    regions[regionId] = {
      id: regionId,
      name: seed.name,
      stations: seed.stations,
      coordinates: { lat: seed.lat, lon: seed.lon },
      psi24hr,
      psi3hrDelta: cfg.deltas[regionId] + Math.round(driftByRegion[regionId] * 0.5),
      band: getPsiBand(psi24hr),
      pollutants: buildPollutants(psi24hr, pm25Hourly),
    };
  }

  return {
    scenarioId,
    updatedAtIso: now.toISOString(),
    updatedAtSgt: `${formatSgtTime(now)} SGT`,
    regions,
    hourlyHistory: buildHourlyHistory(scenarioId, now, driftByRegion),
    weather: cfg.weather,
    sourceLabel: 'Frontend Simulation Provider',
  };
}

export const mockPsiProvider: PsiDataProvider = {
  id: 'frontend-simulation',
  label: 'Frontend Simulation Provider',
  async fetchSnapshot(scenarioId: ScenarioId = 'moderate'): Promise<PsiSnapshot> {
    return createSnapshot(scenarioId);
  },
};
