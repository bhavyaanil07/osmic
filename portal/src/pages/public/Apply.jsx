import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Camera } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Button, Field, ease } from '../../components/ui';
import { Logo } from '../../components/Logo';

const empty = { name: '', roll: '', email: '', mobile: '', whatsapp: '', photo: null };
const COLLEGE_DOMAIN = '@am.students.amrita.edu';

function validate(f, same) {
  const e = {};
  if (f.name.trim().length < 3) e.name = 'Enter your full name.';
  if (!/^[A-Za-z0-9.]{6,}$/.test(f.roll.trim())) e.roll = 'Enter your roll number, e.g. AM.EN.U4AID24003.';
  if (!f.email.trim().toLowerCase().endsWith(COLLEGE_DOMAIN)) e.email = `Use your college email (${COLLEGE_DOMAIN}).`;
  if (!/^[6-9]\d{9}$/.test(f.mobile.replace(/\s/g, ''))) e.mobile = 'Enter a valid 10-digit mobile number.';
  if (!same && !/^[6-9]\d{9}$/.test(f.whatsapp.replace(/\s/g, ''))) e.whatsapp = 'Enter a valid 10-digit WhatsApp number.';
  if (!f.photo) e.photo = 'Add a photo so the admin can recognise you.';
  return e;
}

function SuccessCheck() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
      <motion.circle cx="36" cy="36" r="32" fill="#19361C" stroke="#9BE38A" strokeWidth="3"
        initial={{ pathLength: 0, scale: 0.6 }} animate={{ pathLength: 1, scale: 1 }} transition={{ duration: 0.6, ease }} />
      <motion.path d="M22 37l9 9 19-20" fill="none" stroke="#9BE38A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.45, duration: 0.45, ease }} />
    </svg>
  );
}

export default function Apply() {
  const { actions } = useStore();
  const [f, setF] = useState(empty);
  const [same, setSame] = useState(true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  const set = (k) => (e) => { setF((x) => ({ ...x, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/image\/(png|jpe?g)/.test(file.type)) { setErrors((x) => ({ ...x, photo: 'Use a JPG or PNG image.' })); return; }
    if (file.size > 2 * 1024 * 1024) { setErrors((x) => ({ ...x, photo: 'The photo must be 2 MB or smaller.' })); return; }
    // Shrink the photo so the demo can keep it in browser storage.
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const size = 240;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        setF((x) => ({ ...x, photo: canvas.toDataURL('image/jpeg', 0.82) }));
        setErrors((x) => ({ ...x, photo: undefined }));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const errs = validate(f, same);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const data = { ...f, mobile: f.mobile.replace(/\s/g, ''), whatsapp: (same ? f.mobile : f.whatsapp).replace(/\s/g, '') };
    const res = actions.submitApplication(data);
    if (res.error) { setFormError(res.error); return; }
    setDone(true);
  };

  return (
    <div className="cyber-bg relative min-h-screen overflow-hidden">
      <div className="scanlines pointer-events-none absolute inset-x-0 top-0 h-80 bg-ink-950 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" aria-hidden="true">
        <div className="tech-grid absolute inset-0" />
        <div className="animate-drift absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-brand-600/40 blur-[90px]" />
      </div>
      <div className="relative mx-auto flex max-w-[640px] flex-col gap-6 px-4 py-8 sm:py-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link to="/login" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to log in
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {!done ? (
            <motion.form key="form" onSubmit={onSubmit} noValidate
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16, scale: 0.98 }} transition={{ duration: 0.5, ease }}
              className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-panel p-6 shadow-lift sm:p-8">
              <div>
                <h1 className="font-display text-[28px] font-bold tracking-tight">Apply to join OSMIC</h1>
                <p className="mt-1.5 text-slate-500">The admin reviews every application. Once you are approved, you get an email with a link to set your password.</p>
              </div>

              <div className="flex flex-wrap items-center gap-5">
                <motion.button type="button" onClick={() => fileRef.current?.click()} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  aria-label={f.photo ? 'Change photo' : 'Upload photo'}
                  className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-brand-400 hover:text-brand-600">
                  <AnimatePresence mode="wait">
                    {f.photo
                      ? <motion.img key="img" src={f.photo} alt="" className="h-full w-full object-cover" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} />
                      : <motion.span key="ic" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Camera className="h-7 w-7" /></motion.span>}
                  </AnimatePresence>
                </motion.button>
                <div className="flex flex-col gap-1">
                  <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>{f.photo ? 'Change photo' : 'Upload photo'}</Button>
                  <span className="text-xs text-slate-500">JPG or PNG, up to 2 MB</span>
                  {errors.photo && <span className="text-xs font-medium text-red-600">{errors.photo}</span>}
                </div>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onPhoto} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" error={errors.name}>
                  <input className="input" value={f.name} onChange={set('name')} placeholder="Your full name" autoComplete="name" />
                </Field>
                <Field label="Roll number" error={errors.roll}>
                  <input className="input font-mono uppercase" value={f.roll} onChange={set('roll')} placeholder="AM.EN.U4AID24000" />
                </Field>
                <Field label="College email" error={errors.email} className="sm:col-span-2">
                  <input className="input" type="email" value={f.email} onChange={set('email')} placeholder={`you${COLLEGE_DOMAIN}`} autoComplete="email" />
                </Field>
                <Field label="Mobile number" error={errors.mobile}>
                  <input className="input" type="tel" inputMode="numeric" value={f.mobile} onChange={set('mobile')} placeholder="10-digit number" autoComplete="tel" />
                </Field>
                <AnimatePresence initial={false}>
                  {!same && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <Field label="WhatsApp number" error={errors.whatsapp}>
                        <input className="input" type="tel" inputMode="numeric" value={f.whatsapp} onChange={set('whatsapp')} placeholder="10-digit number" />
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>
                <label className="flex min-h-[32px] items-center gap-2.5 text-sm text-slate-700 sm:col-span-2">
                  <input type="checkbox" checked={same} onChange={(e) => setSame(e.target.checked)} className="h-[18px] w-[18px] accent-brand-600" />
                  My WhatsApp number is the same as my mobile number
                </label>
              </div>

              {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{formError}</p>}
              <Button type="submit" size="lg">Submit application</Button>
            </motion.form>
          ) : (
            <motion.div key="done" role="status"
              initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease }}
              className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-panel px-6 py-12 text-center shadow-lift">
              <SuccessCheck />
              <h1 className="font-display text-2xl font-bold">Application received</h1>
              <p className="max-w-sm text-slate-500">Thanks, {f.name.split(' ')[0]}! You will get an email once the admin approves you and assigns your club lead.</p>
              <Link to="/login" className="mt-3"><Button>Back to log in</Button></Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
