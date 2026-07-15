import React from 'react';
import { Clock3Icon, MapPinIcon } from 'lucide-react';
import type { VoicemailRecord } from '../types/record';

function formatDate(date: string) { const parsed = new Date(`${date}T00:00:00`); return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }); }

export function RecordCard({ record }: { record: VoicemailRecord; index: number }) {
  return <article className="group border-b border-black/[0.06] bg-white px-4 py-3 last:border-0 hover:bg-maroon/[0.018] sm:px-5">
    <div className="grid min-w-0 gap-3 sm:grid-cols-[120px_1fr_130px_140px] sm:items-center">
      <div className="flex items-center justify-between sm:block"><div><p className="text-[11px] font-semibold text-ink/40">{formatDate(record.date)}</p><p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-ink/70"><Clock3Icon size={12} className="text-maroon" />{record.time}</p></div><span className="rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-emerald-700 sm:hidden">Saved</span></div>
      <div className="min-w-0"><div className="flex items-center gap-2"><p className="text-[15px] font-black tracking-wide text-ink">{record.plateNumber}</p><span className="rounded bg-canvas px-1.5 py-0.5 text-[9px] font-bold uppercase text-ink/45">Unit {record.unitNo}</span></div><p className="mt-0.5 truncate text-xs text-ink/50">{record.colour} {record.vehicleMake} · {record.phoneNumber}</p></div>
      <div className="min-w-0"><p className="flex items-center gap-1.5 truncate text-xs font-semibold text-ink/60"><MapPinIcon size={13} className="shrink-0 text-maroon" />{record.siteLocation || 'Site unavailable'}</p></div>
      <div className="flex items-center justify-between gap-2 sm:block sm:text-right"><p className="truncate text-xs font-bold text-ink/65">{record.guardName}</p><p className="mt-0.5 text-[10px] text-ink/35">{record.parkingDurationHours || 24}h authorization</p></div>
    </div>
  </article>;
}
