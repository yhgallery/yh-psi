import { PsiDataProvider, PsiSnapshot } from '../types/psi';

export interface ApiHealthStatus {
  ok: boolean;
  status: string;
  service: string;
  upstreamEndpoint: string;
  upstreamStatus: 'not_checked' | 'reachable' | 'degraded';
  timestamp: string;
}

export const liveNeaProvider: PsiDataProvider = {
  id: 'nea-serverless-api',
  label: 'Live NEA API (data.gov.sg v2)',
  async fetchSnapshot(): Promise<PsiSnapshot> {
    const response = await fetch('/api/psi', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      let message = `API request failed (${response.status})`;
      try {
        const errBody = (await response.json()) as { error?: string };
        if (errBody.error) message = errBody.error;
      } catch {
        // Use HTTP status fallback message
      }
      throw new Error(message);
    }

    return (await response.json()) as PsiSnapshot;
  },
};

export async function fetchApiHealth(checkUpstream = false): Promise<ApiHealthStatus> {
  const url = checkUpstream ? '/api/health?check=upstream' : '/api/health';
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Health check failed (${response.status})`);
  }

  return (await response.json()) as ApiHealthStatus;
}
