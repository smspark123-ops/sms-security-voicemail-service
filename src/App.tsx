import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

const NewRecord = lazy(() => import('./pages/NewRecord').then((m) => ({ default: m.NewRecord })));
const Records = lazy(() => import('./pages/Records').then((m) => ({ default: m.Records })));
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const Terms = lazy(() => import('./pages/Terms').then((m) => ({ default: m.Terms })));
const Enforcement = lazy(() => import('./pages/Enforcement').then((m) => ({ default: m.Enforcement })));

function PageLoader() {
  return <div className="mx-auto flex min-h-[45vh] max-w-6xl items-center justify-center px-6"><div className="h-7 w-7 animate-spin rounded-full border-2 border-maroon/20 border-t-maroon" aria-label="Loading page" /></div>;
}

export function App() {
  return <BrowserRouter>
    <div className="flex min-h-full w-full flex-col bg-canvas">
      <Header />
      <main className="flex-1"><Suspense fallback={<PageLoader />}><Routes>
        <Route path="/" element={<NewRecord />} />
        <Route path="/records" element={<Records />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/enforcement" element={<Enforcement />} />
        <Route path="*" element={<NewRecord />} />
      </Routes></Suspense></main>
      <Footer />
    </div>
    <Toaster position="top-center" toastOptions={{ style: { borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' } }} />
  </BrowserRouter>;
}
