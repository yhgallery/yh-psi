import { PsiBandId, RegionId } from '../types/psi';

export interface PsiBandMeta {
  id: PsiBandId;
  label: string;
  rangeLabel: string;
  min: number;
  max: number | null;
  symbol: string;
  textClass: string;
  surfaceClass: string;
  borderClass: string;
  dotFill: string;
  zoneFill: string;
  zoneStroke: string;
  summary: string;
  generalPublic: string;
  vulnerableGroups: string;
  maskGuidance: string;
  schoolsAndWork: string;
}

export const NEA_PSI_BANDS: Record<PsiBandId, PsiBandMeta> = {
  good: {
    id: 'good',
    label: 'Good',
    rangeLabel: '0–50',
    min: 0,
    max: 50,
    symbol: '●',
    textClass: 'text-emerald-700',
    surfaceClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    dotFill: '#059669',
    zoneFill: 'rgba(16, 185, 129, 0.14)',
    zoneStroke: '#059669',
    summary: 'Clean ambient air across Singapore with minimal particulate load.',
    generalPublic: 'Normal outdoor activities and vigorous exercise.',
    vulnerableGroups: 'Normal activities; no special precautions required.',
    maskGuidance: 'No respiratory protection needed.',
    schoolsAndWork: 'Standard physical education and outdoor operations.',
  },
  moderate: {
    id: 'moderate',
    label: 'Moderate',
    rangeLabel: '51–100',
    min: 51,
    max: 100,
    symbol: '◆',
    textClass: 'text-sky-700',
    surfaceClass: 'bg-sky-50',
    borderClass: 'border-sky-200',
    dotFill: '#0284C7',
    zoneFill: 'rgba(14, 165, 233, 0.14)',
    zoneStroke: '#0284C7',
    summary: 'Light haze perceptible at horizon; air quality remains acceptable.',
    generalPublic: 'Normal activities; monitor 1-hr PM2.5 before intense sport.',
    vulnerableGroups: 'Continue normal routine; keep rescue inhalers accessible.',
    maskGuidance: 'Not generally required for healthy individuals.',
    schoolsAndWork: 'Normal schedules; pace endurance drills if PM2.5 rises.',
  },
  unhealthy: {
    id: 'unhealthy',
    label: 'Unhealthy',
    rangeLabel: '101–200',
    min: 101,
    max: 200,
    symbol: '▲',
    textClass: 'text-amber-700',
    surfaceClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    dotFill: '#D97706',
    zoneFill: 'rgba(245, 158, 11, 0.20)',
    zoneStroke: '#D97706',
    summary: 'Elevated transboundary smoke haze impacting visibility and respiratory comfort.',
    generalPublic: 'Reduce prolonged or strenuous outdoor physical exertion.',
    vulnerableGroups: 'Minimise prolonged or strenuous outdoor physical exertion.',
    maskGuidance: 'Use N95 mask only for prolonged unavoidable outdoor exposure.',
    schoolsAndWork: 'Shift vigorous PE indoors; provide air-conditioned rest zones.',
  },
  'very-unhealthy': {
    id: 'very-unhealthy',
    label: 'Very Unhealthy',
    rangeLabel: '201–300',
    min: 201,
    max: 300,
    symbol: '■',
    textClass: 'text-orange-700',
    surfaceClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    dotFill: '#EA580C',
    zoneFill: 'rgba(234, 88, 12, 0.24)',
    zoneStroke: '#EA580C',
    summary: 'Dense haze plume reducing horizontal visibility across the island.',
    generalPublic: 'Avoid prolonged or strenuous outdoor physical exertion.',
    vulnerableGroups: 'Minimise all outdoor activity; keep windows closed with HEPA filtration.',
    maskGuidance: 'Wear a properly fitted N95 mask when outdoors.',
    schoolsAndWork: 'Cancel outdoor sports and non-essential field work.',
  },
  hazardous: {
    id: 'hazardous',
    label: 'Hazardous',
    rangeLabel: '>300',
    min: 301,
    max: null,
    symbol: '✖',
    textClass: 'text-rose-700',
    surfaceClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    dotFill: '#DC2626',
    zoneFill: 'rgba(220, 38, 38, 0.26)',
    zoneStroke: '#DC2626',
    summary: 'Severe particulate episode requiring immediate exposure mitigation.',
    generalPublic: 'Minimise outdoor activity; stay indoors with windows sealed.',
    vulnerableGroups: 'Avoid all outdoor activity; seek medical care if breathless.',
    maskGuidance: 'N95 respirator strongly advised for any outdoor transit.',
    schoolsAndWork: 'Activate national haze continuity measures and indoor sheltering.',
  },
};

export const NEA_BAND_ORDER: PsiBandId[] = [
  'good',
  'moderate',
  'unhealthy',
  'very-unhealthy',
  'hazardous',
];

export function getPsiBand(psiValue: number): PsiBandId {
  if (psiValue <= 50) return 'good';
  if (psiValue <= 100) return 'moderate';
  if (psiValue <= 200) return 'unhealthy';
  if (psiValue <= 300) return 'very-unhealthy';
  return 'hazardous';
}

export function getPm25BandLabel(pm25: number): string {
  if (pm25 <= 55) return 'Band I · Normal';
  if (pm25 <= 150) return 'Band II · Elevated';
  if (pm25 <= 250) return 'Band III · High';
  return 'Band IV · Very High';
}

export const REGION_ORDER: RegionId[] = ['north', 'central', 'east', 'west', 'south'];

export const POLLUTANT_SPECS = [
  {
    key: 'pm25Hourly' as const,
    label: 'PM2.5 (1-hr)',
    unit: 'µg/m³',
    referenceMax: 250,
    guideline: 'NEA Band I ≤ 55 µg/m³',
  },
  {
    key: 'pm10' as const,
    label: 'PM10 (24-hr)',
    unit: 'µg/m³',
    referenceMax: 350,
    guideline: 'PSI 100 threshold: 150 µg/m³',
  },
  {
    key: 'o3' as const,
    label: 'Ozone O₃ (8-hr)',
    unit: 'µg/m³',
    referenceMax: 235,
    guideline: 'PSI 100 threshold: 157 µg/m³',
  },
  {
    key: 'so2' as const,
    label: 'SO₂ (24-hr)',
    unit: 'µg/m³',
    referenceMax: 365,
    guideline: 'PSI 100 threshold: 80 µg/m³',
  },
  {
    key: 'no2' as const,
    label: 'NO₂ (1-hr)',
    unit: 'µg/m³',
    referenceMax: 400,
    guideline: 'WHO 1-hr guidance: 200 µg/m³',
  },
  {
    key: 'co' as const,
    label: 'CO (8-hr)',
    unit: 'mg/m³',
    referenceMax: 15,
    guideline: 'PSI 100 threshold: 10 mg/m³',
  },
];
