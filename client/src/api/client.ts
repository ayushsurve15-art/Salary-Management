import type { ErrorDetail } from './types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Field-level messages keyed by field name, for showing next to form inputs. */
  fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.details.map((detail) => [detail.path, detail.message]));
  }
}

type ErrorBody = { error?: { code?: string; message?: string; details?: ErrorDetail[] } };

function toApiError(status: number, body: unknown): ApiError {
  const error = (body as ErrorBody | null)?.error;
  return new ApiError(
    status,
    error?.code ?? 'UNKNOWN_ERROR',
    error?.message ?? `Request failed with status ${status}`,
    error?.details,
  );
}

export type QueryValue = string | number | undefined;

export function toQueryString(query: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, body);
  return body as T;
}
