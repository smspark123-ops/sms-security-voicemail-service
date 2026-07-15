import { useCallback, useEffect, useState } from 'react';
import type { VoicemailRecord, RecordFormValues } from '../types/record';

const STORAGE_KEY = 'sms-voicemail-records-v1';

function readStorage(): VoicemailRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(records: VoicemailRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {

    /* ignore quota errors */}
}

const listeners = new Set<() => void>();
let cache: VoicemailRecord[] | null = null;

function getRecords(): VoicemailRecord[] {
  if (cache === null) cache = readStorage();
  return cache;
}

function setRecords(next: VoicemailRecord[]) {
  cache = next;
  writeStorage(next);
  listeners.forEach((l) => l());
}

function makeId(): string {
  return `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Records are never deleted month-to-month. Adding appends to the running log.
 */
export function useRecords() {
  const [records, setLocal] = useState<VoicemailRecord[]>(getRecords);

  useEffect(() => {
    const listener = () => setLocal([...getRecords()]);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const addRecord = useCallback((values: RecordFormValues): VoicemailRecord => {
    const record: VoicemailRecord = {
      ...values,
      id: makeId(),
      createdAt: new Date().toISOString()
    };
    // Newest first for display; underlying data preserved permanently.
    setRecords([record, ...getRecords()]);
    return record;
  }, []);

  return { records, addRecord };
}