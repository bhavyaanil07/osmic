import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FingerprintPattern, KeyRound, Laptop, ScanFace, ShieldCheck, Smartphone, Trash } from 'lucide-react';
import { useStore } from '../../lib/store';
import { passkeySupported, registerPasskey } from '../../lib/passkey';
import { fmtDate, timeAgo } from '../../lib/dates';
import { DEMO_PASSWORD } from '../../lib/demoData';
import { PageHeader } from '../../components/AppLayout';
import { Button, Card, SectionTitle, Stagger, ease } from '../../components/ui';
import { useToast } from '../../components/Toasts';

export default function Security() {
  const { viewer, actions } = useStore();
  const toast = useToast();
  const [supported, setSupported] = useState(null);
  const [busy, setBusy] = useState(false);
  const keys = viewer.passkeys || [];

  useEffect(() => { passkeySupported().then(setSupported); }, []);

  const setUp = async () => {
    setBusy(true);
    const key = await registerPasskey(viewer, keys.map((k) => k.id));
    setBusy(false);
    if (key.error) return toast(key.error, 'error');
    const r = actions.addPasskey(viewer.id, key);
    if (r.error) return toast(r.error, 'error');
    toast('Face ID / fingerprint is set up. You can use it on the login page now.');
  };

  return (
    <>
      <PageHeader title="Security" sub="How the admin signs in: Face ID, fingerprint or password." />
      <Stagger className="flex flex-col gap-5">
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div className="tech-grid absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="relative flex flex-wrap items-center gap-6">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-brand-50 ring-1 ring-brand-300">
              <AnimatePresence>
                {busy && (
                  <motion.span key="ring" className="absolute inset-0 rounded-full border-2 border-brand-600"
                    initial={{ scale: 0.9, opacity: 0.9 }} animate={{ scale: 1.5, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, repeat: Infinity }} />
                )}
              </AnimatePresence>
              <motion.span animate={busy ? { scale: [1, 1.08, 1] } : {}} transition={{ duration: 1, repeat: Infinity }}>
                <FingerprintPattern className="h-11 w-11 text-brand-600" aria-hidden="true" />
              </motion.span>
            </div>
            <div className="min-w-[240px] flex-1">
              <h2 className="font-display text-lg font-semibold">Face ID / fingerprint sign-in</h2>
              <p className="mt-1 text-sm text-slate-600">
                Uses this device&apos;s own lock: Windows Hello on Windows laptops, Touch ID on Macs, Face ID or fingerprint on phones.
                Your face or fingerprint never leaves the device; the portal only gets a yes or no.
              </p>
              {supported === false && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  This device or browser doesn&apos;t offer Face ID / fingerprint. Turn on Windows Hello (or Touch ID / Face ID) in your device settings, or use the password.
                </p>
              )}
            </div>
            <Button size="lg" icon={ScanFace} onClick={setUp} disabled={!supported || busy}>
              {busy ? 'Waiting for your scan…' : keys.length ? 'Add another device' : 'Set up Face ID / fingerprint'}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle title="Devices that can sign in" sub="Each device you set up appears here. Remove one if you lose it." />
          {keys.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No devices yet. Set one up above.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {keys.map((k) => {
                  const Icon = /phone|iPad|Android/.test(k.device) ? Smartphone : Laptop;
                  return (
                    <motion.li key={k.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { ease } }} exit={{ opacity: 0, x: 40 }}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                      <span className="flex min-w-[200px] flex-1 flex-col">
                        <span className="font-medium">{k.device}</span>
                        <span className="text-xs text-slate-500">Added {fmtDate(k.createdAt)}{k.lastUsedAt ? ` · last used ${timeAgo(k.lastUsedAt)}` : ' · not used yet'}</span>
                      </span>
                      <Button size="sm" variant="danger" icon={Trash} onClick={() => { actions.removePasskey(viewer.id, k.id); toast('Device removed. It can no longer sign in.'); }}>Remove</Button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </Card>

        <Card className="flex flex-wrap items-center gap-4 p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><KeyRound className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-[240px] flex-1">
            <p className="font-semibold">Password</p>
            <p className="text-sm text-slate-600">Always works, on any device. In this demo the password is <span className="font-mono font-semibold text-slate-800">{DEMO_PASSWORD}</span>; real passwords come with stage 2.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> On</span>
        </Card>
      </Stagger>
    </>
  );
}
