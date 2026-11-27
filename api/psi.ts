const UPSTREAM_PSI_ENDPOINT = 'https://api-open.data.gov.sg/v2/real-time/api/psi';

type RegionId = 'north' | 'south' | 'east' | 'west' | 'central';
type PsiBandId = 'good' | 'moderate' | 'unhealthy' | 'very-unhealthy' | 'hazardous';

const REGION_IDS: RegionId[] = ['north', 'central', 'east', 'west', 'south'];

const REGION_STATIONS: Record<RegionId, { name: string; stations: string[]; lat: number; lon: number }> = {
  north: {
    name: 'North',
    stations: ['Woodlands', 'Yishun', 'Sembawang', 'Mandai'],
    lat: 1.41803,
    lon: 103.82,
  },
  central: {
    name: 'Central',
    stations: ['Toa Payoh', 'Bishan', 'Orchard', 'Marina Bay'],
    lat: 1.35735,
    lon: 103.82,
  },
  east: {
    name: 'East',
    stations: ['Tampines', 'Pasir Ris', 'Changi', 'Bedok'],
    lat: 1.35735,
    lon: 103.94,
  },
  west: {
    name: 'West',
    stations: ['Jurong West', 'Tuas', 'Boon Lay', 'Bukit Batok'],
    lat: 1.35735,
    lon: 103.7,
  },
  south: {
    name: 'South',
    stations: ['Queenstown', 'Bukit Merah', 'HarbourFront', 'Sentosa'],
    lat: 1.29587,
    lon: 103.82,
  },
};

interface DataGovRegionMeta {
  name: string;
  labelLocation?: {
    latitude?: number;
    longitude?: number;
  };
}

interface DataGovReadings {
  psi_twenty_four_hourly?: Partial<Record<RegionId, number>>;
  pm25_twenty_four_hourly?: Partial<Record<RegionId, number>>;
  pm25_sub_index?: Partial<Record<RegionId, number>>;
  pm10_twenty_four_hourly?: Partial<Record<RegionId, number>>;
  o3_eight_hour_max?: Partial<Record<RegionId, number>>;
  so2_twenty_four_hourly?: Partial<Record<RegionId, number>>;
  no2_one_hour_max?: Partial<Record<RegionId, number>>;
  co_eight_hour_max?: Partial<Record<RegionId, number>>;
}

interface DataGovPsiItem {
  date?: string;
  updatedTimestamp?: string;
  timestamp: string;
  readings: DataGovReadings;
}

interface DataGovPsiResponse {
  code?: number;
  errorMsg?: string;
  data?: {
    regionMetadata?: DataGovRegionMeta[];
    items?: DataGovPsiItem[];
  };
}

export interface ServerlessRequest {
  method?: string;
  query?: Record<string, unknown>;
  url?: string;
}

export interface ServerlessResponse {
  status(code: number): ServerlessResponse;
  json(body: unknown): unknown;
  setHeader(name: string, value: string): unknown;
}

function getPsiBand(psiValue: number): PsiBandId {
  if (psiValue <= 50) return 'good';
  if (psiValue <= 100) return 'moderate';
  if (psiValue <= 200) return 'unhealthy';
  if (psiValue <= 300) return 'very-unhealthy';
  return 'hazardous';
}

function formatSgtDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatSgtTime(isoString: string): string {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return '--:-- SGT';
  const hhmm = new Intl.DateTimeFormat('en-SG', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);
  return `${hhmm} SGT`;
}

function formatSgtHourLabel(isoString: string): string {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return '00:00';
  const hh = new Intl.DateTimeFormat('en-SG', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    hour12: false,
  }).format(parsed);
  return `${hh}:00`;
}

async function fetchDataGovPsi(dateParam?: string): Promise<DataGovPsiResponse> {
  const url = new URL(UPSTREAM_PSI_ENDPOINT);
  if (dateParam) {
    url.searchParams.set('date', dateParam);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Upstream HTTP ${response.status}`);
  }

  return (await response.json()) as DataGovPsiResponse;
}

function readNum(map: Partial<Record<RegionId, number>> | undefined, id: RegionId, fallback = 0): number {
  const val = map?.[id];
  return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
}

export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
): Promise<void> {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawDate = req.query?.date;
  if (rawDate !== undefined) {
    if (typeof rawDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      res.status(400).json({ error: 'Invalid date parameter. Expected YYYY-MM-DD.' });
      return;
    }
  }

  try {
    const now = new Date();
    const todaySgt = typeof rawDate === 'string' ? rawDate : formatSgtDate(now);
    const yesterdaySgt = formatSgtDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));

    let regionMetadata: DataGovRegionMeta[] = [];
    let combinedItems: DataGovPsiItem[] = [];

    if (typeof rawDate === 'string') {
      const dayPayload = await fetchDataGovPsi(todaySgt);
      regionMetadata = dayPayload.data?.regionMetadata ?? [];
      combinedItems = dayPayload.data?.items ?? [];
    } else {
      const [todayRes, yesterdayRes] = await Promise.allSettled([
        fetchDataGovPsi(todaySgt),
        fetchDataGovPsi(yesterdaySgt),
      ]);

      if (todayRes.status === 'fulfilled') {
        regionMetadata = todayRes.value.data?.regionMetadata ?? [];
        combinedItems.push(...(todayRes.value.data?.items ?? []));
      }
      if (yesterdayRes.status === 'fulfilled') {
        if (regionMetadata.length === 0) {
          regionMetadata = yesterdayRes.value.data?.regionMetadata ?? [];
        }
        combinedItems.push(...(yesterdayRes.value.data?.items ?? []));
      }

      if (combinedItems.length === 0) {
        const latestRes = await fetchDataGovPsi();
        regionMetadata = latestRes.data?.regionMetadata ?? [];
        combinedItems = latestRes.data?.items ?? [];
      }
    }

    if (combinedItems.length === 0) {
      res.status(502).json({ error: 'No PSI readings returned by data.gov.sg.' });
      return;
    }

    // Deduplicate by timestamp and sort chronologically ascending
    const itemByTimestamp = new Map<string, DataGovPsiItem>();
    for (const item of combinedItems) {
      if (item.timestamp && item.readings) {
        itemByTimestamp.set(item.timestamp, item);
      }
    }

    const sortedItems = Array.from(itemByTimestamp.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-24);

    const latest = sortedItems[sortedItems.length - 1];
    const threeHoursAgo = sortedItems.length >= 4 ? sortedItems[sortedItems.length - 4] : sortedItems[0];

    const metaLookup = new Map<string, DataGovRegionMeta>();
    for (const meta of regionMetadata) {
      metaLookup.set(meta.name.toLowerCase(), meta);
    }

    const regions: Record<string, unknown> = {};
    for (const rId of REGION_IDS) {
      const seed = REGION_STATIONS[rId];
      const meta = metaLookup.get(rId);
      const lat = meta?.labelLocation?.latitude ?? seed.lat;
      const lon = meta?.labelLocation?.longitude ?? seed.lon;

      const psi24hr = readNum(latest.readings.psi_twenty_four_hourly, rId);
      const prevPsi = readNum(threeHoursAgo.readings.psi_twenty_four_hourly, rId, psi24hr);

      regions[rId] = {
        id: rId,
        name: seed.name,
        stations: seed.stations,
        coordinates: { lat, lon },
        psi24hr,
        psi3hrDelta: psi24hr - prevPsi,
        band: getPsiBand(psi24hr),
        pollutants: {
          pm25Hourly: readNum(latest.readings.pm25_twenty_four_hourly, rId),
          pm25SubIndex: readNum(latest.readings.pm25_sub_index, rId),
          pm10: readNum(latest.readings.pm10_twenty_four_hourly, rId),
          o3: readNum(latest.readings.o3_eight_hour_max, rId),
          so2: readNum(latest.readings.so2_twenty_four_hourly, rId),
          no2: readNum(latest.readings.no2_one_hour_max, rId),
          co: readNum(latest.readings.co_eight_hour_max, rId),
        },
      };
    }

    const hourlyHistory = sortedItems.map((item) => {
      const psi: Record<string, number> = {};
      const pm25: Record<string, number> = {};
      for (const rId of REGION_IDS) {
        psi[rId] = readNum(item.readings.psi_twenty_four_hourly, rId);
        pm25[rId] = readNum(item.readings.pm25_twenty_four_hourly, rId);
      }
      return {
        hourLabel: formatSgtHourLabel(item.timestamp),
        timestampIso: item.timestamp,
        psi,
        pm25,
      };
    });

    const updatedAtIso = latest.updatedTimestamp ?? latest.timestamp;

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.status(200).json({
      scenarioId: 'baseline',
      updatedAtIso,
      updatedAtSgt: formatSgtTime(updatedAtIso),
      regions,
      hourlyHistory,
      weather: {
        windDirectionDeg: 180,
        windCompass: 'S',
        windSpeedKmh: 12,
        visibilityKm: 16.0,
        humidityPct: 78,
        temperatureC: 30.0,
        monsoonNote:
          'Live 24-hour PSI telemetry sourced directly from Singapore NEA via data.gov.sg v2.',
      },
      sourceLabel: 'Live NEA API (data.gov.sg v2)',
    });
  } catch {
    res.status(502).json({
      error: 'Unable to retrieve live PSI readings from data.gov.sg at this time.',
    });
  }
}
