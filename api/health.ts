const UPSTREAM_PSI_ENDPOINT = 'https://api-open.data.gov.sg/v2/real-time/api/psi';

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

export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
): Promise<void> {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const checkUpstream = req.query?.check === 'upstream';
  let upstreamStatus: 'not_checked' | 'reachable' | 'degraded' = 'not_checked';

  if (checkUpstream) {
    try {
      const upstreamRes = await fetch(UPSTREAM_PSI_ENDPOINT, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4500),
      });
      upstreamStatus = upstreamRes.ok ? 'reachable' : 'degraded';
    } catch {
      upstreamStatus = 'degraded';
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    status: 'healthy',
    service: 'sg-hazewatch-api',
    upstreamEndpoint: UPSTREAM_PSI_ENDPOINT,
    upstreamStatus,
    timestamp: new Date().toISOString(),
  });
}
