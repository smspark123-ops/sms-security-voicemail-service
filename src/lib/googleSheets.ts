import type { RecordFormValues } from '../types/record';

const GOOGLE_SHEETS_ENDPOINT = '/api/google';

interface SaveResponse {
  ok: boolean;
  message?: string;
  error?: string;
  month?: string;
  site?: string;
  row?: number;
  id?: string;
  expiresAt?: string;
}

export interface ParkingAuthorization {
  id: string;
  siteLocation: string;
  date: string;
  time: string;
  unitNo: string;
  plateNumber: string;
  vehicleMake: string;
  colour: string;
  parkingDurationHours: number;
  expiresAt: string;
  submittedAt: string;
}

export async function saveRecordToGoogleSheets(
  record: RecordFormValues
): Promise<SaveResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);

  try {
    // text/plain avoids an unnecessary CORS preflight for Apps Script web apps.
    const response = await fetch(GOOGLE_SHEETS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(record),
      redirect: 'follow',
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`Google Sheets returned HTTP ${response.status}`);
    const result = (await response.json()) as SaveResponse;
    if (!result.ok) throw new Error(result.error || 'Google Sheets rejected the record');
    return result;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Google Sheets did not respond in time. Please try again.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchParkingAuthorizations(): Promise<ParkingAuthorization[]> {
  const response = await fetch(`${GOOGLE_SHEETS_ENDPOINT}?action=parking&_=${Date.now()}`, { cache: 'no-store', redirect: 'follow' });
  if (!response.ok) throw new Error('Unable to load parking authorizations');
  const result = await response.json() as { ok: boolean; records?: ParkingAuthorization[]; error?: string };
  if (!result.ok) throw new Error(result.error || 'Unable to load parking authorizations');
  return result.records || [];
}

export async function fetchRecordMonths(): Promise<string[]> {
  const response = await fetch(`${GOOGLE_SHEETS_ENDPOINT}?action=months&_=${Date.now()}`, { cache: 'no-store' });
  const result = await response.json() as { ok: boolean; months?: string[]; error?: string };
  if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to load record months');
  return result.months || [];
}

export async function fetchMonthlyRecords(month: string): Promise<import('../types/record').VoicemailRecord[]> {
  const response = await fetch(`${GOOGLE_SHEETS_ENDPOINT}?action=records&month=${encodeURIComponent(month)}&_=${Date.now()}`, { cache: 'no-store' });
  const result = await response.json() as { ok: boolean; records?: import('../types/record').VoicemailRecord[]; error?: string };
  if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to load monthly records');
  return result.records || [];
}
