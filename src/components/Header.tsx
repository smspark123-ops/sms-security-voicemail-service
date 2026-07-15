import React from 'react';
import { ClipboardPlusIcon, FileTextIcon, InfoIcon, LogOutIcon, ShieldCheckIcon } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const NAV = [
  { to: '/', label: 'New Record', short: 'New', icon: ClipboardPlusIcon },
  { to: '/records', label: 'Records', short: 'Records', icon: FileTextIcon },
  { to: '/enforcement', label: 'Enforcement', short: 'Officer', icon: ShieldCheckIcon },
  { to: '/about', label: 'About', short: 'About', icon: InfoIcon }
];

export function Header() {
  const location = useLocation();
  const { signOut } = useAuth();
  const active = (to: string) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
  return <>
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3"><div className="relative"><img src="/logo-cta.png" alt="SMS Security" className="h-10 w-10 object-contain" /><span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" /></div><div><p className="text-[15px] font-extrabold tracking-tight text-ink">SMS Security</p><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-maroon/70">Patrol Operations</p></div></Link>
        <nav className="hidden items-center gap-1 rounded-xl border border-black/5 bg-canvas/70 p-1 md:flex" aria-label="Primary navigation">{NAV.map((item) => <NavLink key={item.to} to={item.to} className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${active(item.to) ? 'bg-white text-maroon shadow-sm ring-1 ring-black/5' : 'text-ink/50 hover:text-ink'}`}><item.icon size={15} />{item.label}</NavLink>)}</nav>
        <div className="flex items-center gap-2"><a href="https://smssecurity.ca/" target="_blank" rel="noreferrer" className="hidden rounded-lg border border-maroon/15 px-3 py-2 text-xs font-bold text-maroon hover:bg-maroon/5 lg:block">Official website</a><button onClick={signOut} title="Sign out" className="flex h-9 w-9 items-center justify-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-600"><LogOutIcon size={16} /></button></div>
      </div>
    </header>
    <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-2xl border border-white/10 bg-ink/95 p-1.5 shadow-2xl backdrop-blur-xl md:hidden" aria-label="Mobile navigation">{NAV.map((item) => <NavLink key={item.to} to={item.to} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold ${active(item.to) ? 'bg-white text-maroon' : 'text-white/55'}`}><item.icon size={17} /><span className="truncate">{item.short}</span></NavLink>)}</nav>
  </>;
}
