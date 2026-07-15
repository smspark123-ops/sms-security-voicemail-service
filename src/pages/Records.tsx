import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DownloadIcon, FileTextIcon, InboxIcon, PrinterIcon, RefreshCwIcon, SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RecordCard } from '../components/RecordCard';
import { fetchMonthlyRecords, fetchRecordMonths } from '../lib/googleSheets';
import type { VoicemailRecord } from '../types/record';

function monthLabel(key: string) { const [year, month] = key.split('-').map(Number); return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); }
function currentMonthKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
function csvCell(value: string) { return `"${value.replace(/"/g, '""')}"`; }

export function Records() {
  const [months, setMonths] = useState<string[]>([currentMonthKey()]);
  const [records, setRecords] = useState<VoicemailRecord[]>([]);
  const [selected, setSelected] = useState(currentMonthKey);
  const [query, setQuery] = useState('');
  const [site, setSite] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(100);

  const loadMonths = useCallback(async () => { try { const remote = await fetchRecordMonths(); setMonths(Array.from(new Set([currentMonthKey(), ...remote])).sort().reverse()); } catch { /* month records still remain usable */ } }, []);
  const loadRecords = useCallback(async () => { setLoading(true); try { setRecords(await fetchMonthlyRecords(selected)); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load records'); } finally { setLoading(false); } }, [selected]);
  useEffect(() => { loadMonths(); }, [loadMonths]);
  useEffect(() => { loadRecords(); }, [loadRecords]);
  useEffect(() => { setVisibleCount(100); }, [selected, query, site]);

  const sites = useMemo(() => Array.from(new Set(records.map((r) => r.siteLocation).filter(Boolean) as string[])).sort(), [records]);
  const filtered = useMemo(() => { const term = query.trim().toLowerCase(); return records.filter((record) => (!site || record.siteLocation === site) && (!term || [record.plateNumber, record.unitNo, record.phoneNumber, record.guardName, record.vehicleMake, record.siteLocation || ''].some((value) => value.toLowerCase().includes(term)))); }, [records, query, site]);

  function exportCsv() { const headers = ['Date', 'Time', 'Site', 'Unit', 'Licence Plate', 'Make', 'Colour', 'Phone', 'Guard', 'Authorized Hours', 'Expires At']; const rows = filtered.map((r) => [r.date, r.time, r.siteLocation || '', r.unitNo, r.plateNumber, r.vehicleMake, r.colour, r.phoneNumber, r.guardName, String(r.parkingDurationHours || 24), r.expiresAt || '']); const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n'); const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `SMS-records-${selected}.csv`; link.click(); URL.revokeObjectURL(url); }

  return <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
    <div className="no-print mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-extrabold tracking-tight text-ink">Google Sheets records</h1><p className="mt-1 text-sm text-ink/50">Complete month-by-month records shared across every device.</p></div><div className="grid grid-cols-3 gap-2"><button onClick={loadRecords} className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs font-semibold text-ink/65"><RefreshCwIcon size={15} className={loading ? 'animate-spin' : ''} />Refresh</button><button onClick={exportCsv} disabled={!filtered.length} className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs font-semibold text-ink/65 disabled:opacity-40"><DownloadIcon size={15} />CSV</button><button onClick={() => window.print()} disabled={!filtered.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-maroon px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-40"><PrinterIcon size={15} />PDF</button></div></div>
    <div className="no-print mb-4 rounded-2xl border border-black/5 bg-white p-3 shadow-card"><div className="flex gap-2 overflow-x-auto pb-2">{months.map((month) => <button key={month} onClick={() => { setSelected(month); setSite(''); }} className={`whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold ${selected === month ? 'bg-maroon text-white' : 'bg-canvas text-ink/55'}`}>{monthLabel(month)}</button>)}</div><div className="grid gap-2 border-t border-black/5 pt-3 sm:grid-cols-[1fr_260px]"><label className="relative"><SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search plate, unit, phone, guard…" className="w-full rounded-xl bg-canvas py-3 pl-10 pr-3 text-sm outline-none focus:ring-4 focus:ring-maroon/10" /></label><select value={site} onChange={(e) => setSite(e.target.value)} className="rounded-xl bg-canvas px-3 py-3 text-sm outline-none"><option value="">All sites</option>{sites.map((name) => <option key={name}>{name}</option>)}</select></div></div>
    <div className="no-print mb-4 flex justify-between text-xs font-medium text-ink/45"><span>{loading ? 'Loading Google Sheets…' : `Showing ${filtered.length} of ${records.length} records`}</span><span className="text-red-600">{error}</span></div>
    <div className="no-print overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-card">{!loading && (filtered.length ? filtered.slice(0, visibleCount).map((record, index) => <RecordCard key={record.id} record={record} index={index} />) : <EmptyState hasFilters={!!query || !!site} />)}</div>
    {!loading && filtered.length > visibleCount && <button onClick={() => setVisibleCount((count) => count + 100)} className="no-print mt-5 w-full rounded-xl border border-black/10 bg-white py-3 text-sm font-bold text-maroon shadow-sm">Load 100 more ({filtered.length - visibleCount} remaining)</button>}
    <PrintReport month={selected} records={filtered} site={site} />
  </div>;
}

function PrintReport({ month, records, site }: { month: string; records: VoicemailRecord[]; site: string }) {
  const uniqueSites = new Set(records.map((record) => record.siteLocation)).size;
  const now = new Date();
  return <section className="print-report hidden"><header className="report-heading"><div className="report-brand"><img src="/logo-cta.png" alt="" /><div><p className="report-kicker">SMS Security · Patrol Operations</p><h1>Visitor Parking Authorization Report</h1><p className="report-subtitle">Official operational record · Confidential</p></div></div><div className="report-meta"><strong>{monthLabel(month)}</strong><span>Generated {now.toLocaleDateString()} at {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div></header><div className="report-summary"><div><span>Total entries</span><strong>{records.length}</strong></div><div><span>Sites represented</span><strong>{uniqueSites}</strong></div><div><span>Report scope</span><strong>{site || 'All sites'}</strong></div><div><span>Reporting period</span><strong>{monthLabel(month)}</strong></div></div><div className="report-notice">Review voicemail and confirm unclear or incomplete information before relying on this report for enforcement.</div><table><thead><tr><th>#</th><th>Date</th><th>Time</th><th>Site</th><th>Unit</th><th>Licence plate</th><th>Vehicle</th><th>Phone</th><th>Guard</th><th>Hours</th><th>Expiry</th></tr></thead><tbody>{records.map((r, index) => <tr key={r.id}><td>{index + 1}</td><td>{r.date}</td><td>{r.time}</td><td>{r.siteLocation}</td><td>{r.unitNo}</td><td><strong>{r.plateNumber}</strong></td><td>{r.colour} {r.vehicleMake}</td><td>{r.phoneNumber}</td><td>{r.guardName}</td><td>{r.parkingDurationHours || 24}</td><td>{r.expiresAt ? new Date(r.expiresAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}</td></tr>)}</tbody></table><div className="report-signoff"><div>Prepared/Reviewed by: <span /></div><div>Date: <span /></div><div>Supervisor approval: <span /></div></div><footer>SMS Security Voicemail Service · System-generated operational report · Page printed {now.toLocaleDateString()}</footer></section>;
}
function EmptyState({ hasFilters }: { hasFilters: boolean }) { return <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-black/10 bg-white/60 px-6 py-14 text-center"><InboxIcon className="text-ink/30" size={26} /><p className="mt-3 text-sm font-semibold text-ink">{hasFilters ? 'No matching records' : 'No records this month'}</p>{!hasFilters && <Link to="/" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-maroon px-4 py-2.5 text-sm font-semibold text-white"><FileTextIcon size={15} />New record</Link>}</div>; }
