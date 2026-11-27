export type RegionId = 'north' | 'south' | 'east' | 'west' | 'central';

export type PsiBandId =
  | 'good'
  | 'moderate'
  | 'unhealthy'
  | 'very-unhealthy'
  | 'hazardous';

export type ScenarioId = 'baseline' | 'moderate' | 'unhealthy' | 'severe';

export interface PollutantReadings {
  pm25Hourly: number; // 1-hr PM2.5 (µg/m³)
  pm25SubIndex: number; // 24-hr PM2.5 (µg/m³)
  pm10: number; // 24-hr PM10 (µg/m³)
  o3: number; // 8-hr Ozone (µg/m³)
  so2: number; // 24-hr Sulphur Dioxide (µg/m³)
  no2: number; // 1-hr Nitrogen Dioxide (µg/m³)
  co: number; // 8-hr Carbon Monoxide (mg/m³)
}

export interface RegionReading {
  id: RegionId;
  name: string;
  stations: string[];
  coordinates: {
    lat: number;
    lon: number;
  };
  psi24hr: number;
  psi3hrDelta: number;
  band: PsiBandId;
  pollutants: PollutantReadings;
}

export interface HourlyPoint {
  hourLabel: string; // e.g. "00:00"
  timestampIso: string;
  psi: Record<RegionId, number>;
  pm25: Record<RegionId, number>;
}

export interface WeatherContext {
  windDirectionDeg: number;
  windCompass: string;
  windSpeedKmh: number;
  visibilityKm: number;
  humidityPct: number;
  temperatureC: number;
  monsoonNote: string;
}

export interface PsiSnapshot {
  scenarioId: ScenarioId;
  updatedAtIso: string;
  updatedAtSgt: string;
  regions: Record<RegionId, RegionReading>;
  hourlyHistory: HourlyPoint[];
  weather: WeatherContext;
  sourceLabel: string;
}

export interface PsiDataProvider {
  id: string;
  label: string;
  fetchSnapshot(scenarioId?: ScenarioId): Promise<PsiSnapshot>;
}
