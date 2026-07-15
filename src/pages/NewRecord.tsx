import React from 'react';
import { CheckCircle2Icon, DatabaseIcon, RadioIcon, ShieldCheckIcon } from 'lucide-react';
import { RecordForm } from '../components/RecordForm';

export function NewRecord() {
  return <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
    <section className="relative mb-5 overflow-hidden rounded-2xl bg-ink px-5 py-5 text-white sm:px-7 sm:py-6">
      <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full border-[36px] border-white/[0.035]" /><div className="absolute -right-4 top-4 h-24 w-24 rounded-full bg-maroon/40 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/45"><ShieldCheckIcon size={14} />Mobile patrol command</div><h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Visitor parking authorization</h1><p className="mt-1.5 max-w-xl text-sm text-white/55">Create a verified, time-limited record for enforcement teams and central reporting.</p></div><div className="grid grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-3 sm:w-[340px]"><Status icon={<RadioIcon size={14} />} label="System" value="Online" /><Status icon={<DatabaseIcon size={14} />} label="Storage" value="Google" /><Status icon={<CheckCircle2Icon size={14} />} label="Status" value="Ready" /></div></div>
    </section>
    <RecordForm />
  </div>;
}

function Status({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="px-2 text-center"><span className="mx-auto flex w-fit text-emerald-400">{icon}</span><p className="mt-1 text-[9px] uppercase tracking-wide text-white/35">{label}</p><p className="text-[11px] font-bold text-white/80">{value}</p></div>; }
