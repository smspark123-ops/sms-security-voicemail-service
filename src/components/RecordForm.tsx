import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { CalendarIcon, CarIcon, CheckIcon, Clock3Icon, HashIcon, MapPinIcon, PaletteIcon, PhoneIcon, RotateCcwIcon, UserIcon, WrenchIcon } from 'lucide-react';
import { Field, SelectInput, TextInput } from './ui/Field';
import type { RecordFormValues } from '../types/record';
import { useRecords } from '../lib/store';
import { saveRecordToGoogleSheets } from '../lib/googleSheets';
import { SITE_LOCATIONS, VEHICLE_COLOURS, VEHICLE_MAKES } from '../lib/recordOptions';

const OTHER_OPTION = 'Other';
const OTHER_SITE_OPTION = 'Other / enter a site';
type FormState = RecordFormValues & { customSite: string; customMake: string; customColour: string };
type Errors = Partial<Record<keyof FormState | 'siteLocation', string>>;
const REQUIRED_FIELDS: (keyof RecordFormValues)[] = ['date', 'time', 'siteLocation', 'unitNo', 'phoneNumber', 'plateNumber', 'vehicleMake', 'colour', 'guardName'];
const DRAFT_KEY = 'sms-voicemail-draft-v1';

function todayDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function emptyForm(): FormState { return { date: todayDate(), time: '', siteLocation: '', customSite: '', unitNo: '', phoneNumber: '', plateNumber: '', vehicleMake: '', customMake: '', colour: '', customColour: '', guardName: '', parkingDurationHours: 24 }; }
function initialForm(): FormState { try { const draft = localStorage.getItem(DRAFT_KEY); return draft ? { ...emptyForm(), ...JSON.parse(draft) } : emptyForm(); } catch { return emptyForm(); } }
function currentTime() { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }

export function RecordForm() {
  const { addRecord } = useRecords();
  const [values, setValues] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { localStorage.setItem(DRAFT_KEY, JSON.stringify(values)); }, [values]);
  function set<K extends keyof FormState>(key: K, value: FormState[K]) { setValues((current) => ({ ...current, [key]: value })); if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined })); }
  function validate(): RecordFormValues | null {
    const resolved: RecordFormValues = { date: values.date, time: values.time, siteLocation: values.siteLocation === OTHER_SITE_OPTION ? values.customSite : values.siteLocation, unitNo: values.unitNo, phoneNumber: values.phoneNumber, plateNumber: values.plateNumber, vehicleMake: values.vehicleMake === OTHER_OPTION ? values.customMake : values.vehicleMake, colour: values.colour === OTHER_OPTION ? values.customColour : values.colour, guardName: values.guardName };
    const next: Errors = {};
    REQUIRED_FIELDS.forEach((field) => { if (!resolved[field]?.trim()) next[field] = 'Required'; });
    if (values.siteLocation === OTHER_SITE_OPTION && !values.customSite.trim()) next.customSite = 'Enter the site location';
    if (values.vehicleMake === OTHER_OPTION && !values.customMake.trim()) next.customMake = 'Enter the vehicle make';
    if (values.colour === OTHER_OPTION && !values.customColour.trim()) next.customColour = 'Enter the vehicle colour';
    if (values.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(values.time)) next.time = 'Use 24-hour time, e.g. 21:30';
    if (values.phoneNumber && !/^[+()\-\s\d]{6,}$/.test(values.phoneNumber.trim())) next.phoneNumber = 'Enter a valid phone number';
    setErrors(next); return Object.keys(next).length === 0 ? resolved : null;
  }
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); const resolved = validate();
    if (!resolved) { toast.error('Please complete the highlighted fields.'); return; }
    setSaving(true);
    const cleaned = Object.fromEntries(Object.entries(resolved).map(([key, value]) => [key, value.trim()])) as unknown as RecordFormValues;
    cleaned.plateNumber = cleaned.plateNumber.toUpperCase();
    try {
      const result = await saveRecordToGoogleSheets(cleaned);
      addRecord(cleaned);
      toast.success('Saved to Google Sheets', { description: `${result.month} · ${cleaned.siteLocation}` });
      setValues(emptyForm());
      localStorage.removeItem(DRAFT_KEY);
      setErrors({});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reach Google Sheets.';
      toast.error('Record was not saved', { description: message });
    } finally {
      setSaving(false);
    }
  }
  const customField = (show: boolean, id: 'customSite' | 'customMake' | 'customColour', label: string, icon: React.ReactNode) => <AnimatePresence initial={false}>{show && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Field label={label} htmlFor={id} required error={errors[id]} icon={icon}><TextInput id={id} placeholder={`Enter ${label.toLowerCase()}`} value={values[id]} hasError={!!errors[id]} onChange={(e) => set(id, e.target.value)} /></Field></motion.div>}</AnimatePresence>;

  return <motion.form initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-card" noValidate>
    <div className="flex flex-col gap-1 border-b border-black/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 className="text-base font-extrabold text-ink">Authorization details</h2><p className="text-[11px] text-ink/45">All fields are verified before submission.</p></div><span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 sm:mt-0"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Google Sheets connected</span></div>
    <div className="grid grid-cols-1 gap-x-4 gap-y-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:px-6">
      <Field label="Date" htmlFor="date" required error={errors.date} icon={<CalendarIcon size={14} />}><TextInput id="date" type="date" value={values.date} hasError={!!errors.date} onChange={(e) => set('date', e.target.value)} /></Field>
      <Field label="Voicemail time" htmlFor="time" required error={errors.time} icon={<Clock3Icon size={14} />}><div className="flex gap-2"><TextInput id="time" inputMode="numeric" placeholder="21:30" value={values.time} hasError={!!errors.time} onChange={(e) => set('time', formatTimeInput(e.target.value))} /><button type="button" onClick={() => set('time', currentTime())} className="shrink-0 rounded-xl border border-black/5 bg-canvas px-3 text-xs font-semibold text-maroon hover:bg-maroon/5" title="Use current time">Now</button></div></Field>
      <Field label="Site location" htmlFor="siteLocation" required error={errors.siteLocation} icon={<MapPinIcon size={14} />}><SelectInput id="siteLocation" value={values.siteLocation} hasError={!!errors.siteLocation} onChange={(e) => { set('siteLocation', e.target.value); if (e.target.value !== OTHER_SITE_OPTION) set('customSite', ''); }}><option value="">Select a site</option>{SITE_LOCATIONS.map((site) => <option key={site}>{site}</option>)}</SelectInput></Field>
      {customField(values.siteLocation === OTHER_SITE_OPTION, 'customSite', 'Custom site', <MapPinIcon size={14} />)}
      <Field label="Unit number" htmlFor="unitNo" required error={errors.unitNo} icon={<HashIcon size={14} />}><TextInput id="unitNo" placeholder="e.g. 14B" value={values.unitNo} hasError={!!errors.unitNo} onChange={(e) => set('unitNo', e.target.value)} /></Field>
      <Field label="Caller phone" htmlFor="phoneNumber" required error={errors.phoneNumber} icon={<PhoneIcon size={14} />}><TextInput id="phoneNumber" type="tel" placeholder="e.g. 416-555-0123" value={values.phoneNumber} hasError={!!errors.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)} /></Field>
      <Field label="Licence plate" htmlFor="plateNumber" required error={errors.plateNumber} icon={<CarIcon size={14} />}><TextInput id="plateNumber" placeholder="e.g. ABC 1234" value={values.plateNumber} hasError={!!errors.plateNumber} onChange={(e) => set('plateNumber', e.target.value)} className="uppercase placeholder:normal-case" /></Field>
      <Field label="Vehicle make" htmlFor="vehicleMake" required error={errors.vehicleMake} icon={<WrenchIcon size={14} />}><SelectInput id="vehicleMake" value={values.vehicleMake} hasError={!!errors.vehicleMake} onChange={(e) => { set('vehicleMake', e.target.value); if (e.target.value !== OTHER_OPTION) set('customMake', ''); }}><option value="">Select a make</option>{VEHICLE_MAKES.map((make) => <option key={make}>{make}</option>)}</SelectInput></Field>
      {customField(values.vehicleMake === OTHER_OPTION, 'customMake', 'Custom vehicle make', <WrenchIcon size={14} />)}
      <Field label="Vehicle colour" htmlFor="colour" required error={errors.colour} icon={<PaletteIcon size={14} />}><SelectInput id="colour" value={values.colour} hasError={!!errors.colour} onChange={(e) => { set('colour', e.target.value); if (e.target.value !== OTHER_OPTION) set('customColour', ''); }}><option value="">Select a colour</option>{VEHICLE_COLOURS.map((colour) => <option key={colour}>{colour}</option>)}</SelectInput></Field>
      {customField(values.colour === OTHER_OPTION, 'customColour', 'Custom colour', <PaletteIcon size={14} />)}
      <Field label="Parking authorization" htmlFor="parkingDurationHours" required icon={<Clock3Icon size={14} />} hint="Default: 24 hours. Maximum: 1 year."><div className="relative"><TextInput id="parkingDurationHours" type="number" min="1" max="8760" step="1" value={values.parkingDurationHours} onChange={(e) => set('parkingDurationHours', Math.max(1, Math.min(8760, Number(e.target.value) || 1)))} className="pr-16" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink/40">hours</span></div><div className="mt-1.5 flex gap-1.5">{[24, 48, 72, 168].map((hours) => <button type="button" key={hours} onClick={() => set('parkingDurationHours', hours)} className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${values.parkingDurationHours === hours ? 'bg-maroon text-white' : 'bg-canvas text-ink/50'}`}>{hours === 168 ? '7 days' : `${hours}h`}</button>)}</div></Field>
      <Field label="Guard name" htmlFor="guardName" required error={errors.guardName} icon={<UserIcon size={14} />}><TextInput id="guardName" autoComplete="name" placeholder="Full name" value={values.guardName} hasError={!!errors.guardName} onChange={(e) => set('guardName', e.target.value)} /></Field>
    </div>
    <div className="flex flex-col-reverse gap-3 border-t border-black/[0.06] bg-canvas/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><button type="button" disabled={saving} onClick={() => { setValues(emptyForm()); setErrors({}); localStorage.removeItem(DRAFT_KEY); }} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-ink/50 hover:bg-white disabled:opacity-50"><RotateCcwIcon size={14} />Clear draft</button><div className="flex flex-col items-stretch gap-1 sm:items-end"><button type="submit" disabled={saving || !navigator.onLine} className="inline-flex items-center justify-center gap-2 rounded-lg bg-maroon px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(122,31,61,.18)] hover:bg-maroon-dark disabled:cursor-wait disabled:opacity-60"><CheckIcon size={16} />{saving ? 'Saving securely…' : navigator.onLine ? 'Authorize vehicle' : 'Offline — reconnect to save'}</button><span className="text-center text-[9px] font-medium text-ink/35 sm:text-right">Encrypted connection · automatic draft recovery</span></div></div>
  </motion.form>;
}
function formatTimeInput(value: string) { const digits = value.replace(/\D/g, '').slice(0, 4); return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits; }
