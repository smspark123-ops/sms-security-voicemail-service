import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangleIcon, CarIcon, Clock3Icon, MapPinIcon, RefreshCwIcon, SearchIcon, ShieldCheckIcon } from 'lucide-react';
import { fetchParkingAuthorizations, type ParkingAuthorization } from '../lib/googleSheets';
import { SITE_LOCATIONS } from '../lib/recordOptions';

function remainingLabel(expiresAt: string) {
  const minutes = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60000);
  if (minutes <= 0) return 'Expired';
  if (minutes < 60) return `${minutes} min remaining`;
  const hours = Math.floor(minutes / 60); const mins = minutes % 60;
  if (hours < 48) return `${hours}h ${mins}m remaining`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
}

export function Enforcement() {
  const [records, setRecords] = useState<ParkingAuthorization[]>([]);
  const [query, setQuery] = useState('');
  const [site, setSite] = useState('');
  const [showExpired, setShowExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [clock, setClock] = useState(Date.now());

  const refresh = useCallback(async () => {
    try { const data = await fetchParkingAuthorizations(); setRecords(data); setUpdatedAt(new Date()); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to refresh records'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); const poll = window.setInterval(refresh, 15000); const tick = window.setInterval(() => setClock(Date.now()), 30000); const visible = () => { if (!document.hidden) refresh(); }; document.addEventListener('visibilitychange', visible); return () => { clearInterval(poll); clearInterval(tick); document.removeEventListener('visibilitychange', visible); }; }, [refresh]);

  const filtered = useMemo(() => { const term = query.trim().toLowerCase(); return records.filter((record) => (showExpired || new Date(record.expiresAt).getTime() > clock) && (!site || record.siteLocation === site) && (!term || [record.plateNumber, record.unitNo, record.vehicleMake, record.colour, record.siteLocation].some((value) => value.toLowerCase().includes(term)))); }, [records, showExpired, site, query, clock]);
  const activeCount = records.filter((r) => new Date(r.expiresAt).getTime() > clock).length;

  return <div className="mx-auto max-w-3xl px-3 py-4 sm:px-6 sm:py-8">
    <div className="rounded-3xl bg-ink p-5 text-white"><div className="flex items-center gap-3"><div className="rounded-2xl bg-white/10 p-2.5"><ShieldCheckIcon size={22} /></div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Parking enforcement</p><h1 className="text-2xl font-extrabold">Live authorizations</h1></div><span className="ml-auto rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">{activeCount} active</span></div><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3"><p className="text-xs text-white/50">Auto-refresh every 15 seconds</p><button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-ink"><RefreshCwIcon size={14} className={loading ? 'animate-spin' : ''} />Refresh</button></div></div>
    <aside className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm" role="note"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-700"><AlertTriangleIcon size={18} /></div><div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-amber-800">Officer note — verify before enforcement</p><p className="mt-1.5 text-xs leading-5 text-amber-950/75">Please ensure the voicemail box is empty and that no message remains pending for the selected site before proceeding with enforcement. Licence plates and other details may occasionally be inaccurate because of accents, unclear audio, incomplete messages, background noise, or partially provided information. Confirm the available details whenever possible.</p></div></div></aside>
    <div className="sticky top-16 z-30 mt-3 rounded-2xl border border-black/5 bg-white/95 p-3 shadow-card backdrop-blur"><label className="relative block"><SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search plate, unit or vehicle" className="w-full rounded-xl bg-canvas py-3 pl-10 pr-3 text-base outline-none focus:ring-4 focus:ring-maroon/10" /></label><div className="mt-2 grid grid-cols-[1fr_auto] gap-2"><select value={site} onChange={(e) => setSite(e.target.value)} className="min-w-0 rounded-xl bg-canvas px-3 py-3 text-sm outline-none"><option value="">All 17 sites</option>{SITE_LOCATIONS.map((name) => <option key={name}>{name}</option>)}</select><button onClick={() => setShowExpired((value) => !value)} className={`rounded-xl px-3 py-3 text-xs font-bold ${showExpired ? 'bg-ink text-white' : 'bg-canvas text-ink/55'}`}>{showExpired ? 'All status' : 'Active'}</button></div></div>
    <details className="mt-3 overflow-hidden rounded-xl border border-black/5 bg-white text-xs shadow-sm"><summary className="cursor-pointer px-4 py-3 font-bold text-ink/60">Site directory ({SITE_LOCATIONS.length} locations)</summary><div className="grid gap-px border-t border-black/5 bg-black/5 sm:grid-cols-2">{SITE_LOCATIONS.map((name) => <button key={name} onClick={() => setSite(name)} className="bg-white px-4 py-2.5 text-left font-semibold text-ink/55 hover:text-maroon">{name}</button>)}</div></details>
    <div className="mt-4 flex items-center justify-between text-xs text-ink/45"><span>{filtered.length} {filtered.length === 1 ? 'vehicle' : 'vehicles'}</span><span>{error ? <span className="font-semibold text-red-600">{error}</span> : updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Connecting…'}</span></div>
    <div className="mt-3 space-y-3">{filtered.map((record) => <AuthorizationCard key={record.id} record={record} now={clock} />)}</div>
    {!loading && !filtered.length && <div className="mt-4 rounded-3xl border border-dashed border-black/10 bg-white p-12 text-center"><CarIcon className="mx-auto text-ink/25" size={30} /><p className="mt-3 font-semibold text-ink">No matching authorizations</p><p className="mt-1 text-sm text-ink/45">New entries will appear automatically.</p></div>}
  </div>;
}

function AuthorizationCard({ record, now }: { record: ParkingAuthorization; now: number }) {
  const active = new Date(record.expiresAt).getTime() > now;
  return <article className={`overflow-hidden rounded-xl border-l-[3px] bg-white shadow-card ${active ? 'border-y-black/5 border-r-black/5 border-l-emerald-500' : 'border-y-black/5 border-r-black/5 border-l-red-500 opacity-70'}`}><div className="p-3.5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="text-lg font-black tracking-[0.06em] text-ink">{record.plateNumber}</h2><span className={`rounded px-1.5 py-0.5 text-[8px] font-black tracking-wide ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{active ? 'AUTHORIZED' : 'EXPIRED'}</span></div><p className="mt-0.5 text-xs text-ink/50">{record.colour} {record.vehicleMake} · Unit {record.unitNo}</p></div><p className={`shrink-0 text-right text-[11px] font-extrabold ${active ? 'text-emerald-700' : 'text-red-700'}`}>{remainingLabel(record.expiresAt)}</p></div><div className="mt-3 grid grid-cols-[1fr_auto] gap-2 border-t border-black/5 pt-2.5"><p className="flex min-w-0 items-center gap-1.5 truncate text-[11px] font-semibold text-ink/55"><MapPinIcon size={12} className="shrink-0 text-maroon" />{record.siteLocation}</p><p className="flex items-center gap-1 text-[10px] text-ink/40"><Clock3Icon size={11} />Until {new Date(record.expiresAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p></div></div></article>;
}
