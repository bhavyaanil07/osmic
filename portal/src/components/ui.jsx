// Shared building blocks: buttons, cards, badges, avatars, inputs, modal,
// animated numbers and progress bars.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useInView } from 'framer-motion';
import { X } from 'lucide-react';

export const cx = (...c) => c.filter(Boolean).join(' ');

// ---------- motion presets ----------
export const ease = [0.22, 1, 0.36, 1];
export const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
export const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

export function Stagger({ as = 'div', className, children, ...rest }) {
  const M = motion[as];
  return (
    <M className={className} variants={listVariants} initial="hidden" animate="show" {...rest}>
      {children}
    </M>
  );
}
export function Item({ as = 'div', className, children, ...rest }) {
  const M = motion[as];
  return (
    <M className={className} variants={itemVariants} {...rest}>
      {children}
    </M>
  );
}

// Re-render every `ms` milliseconds (for countdowns and "x min ago").
export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

// ---------- buttons ----------
const BTN = {
  primary: 'border border-brand-600 bg-brand-600 text-ink-900 hover:shadow-glow',
  secondary: 'border border-slate-900/45 bg-transparent text-slate-900 hover:bg-slate-900/10',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-900/10 hover:translate-y-0',
  success: 'bg-emerald-600 text-ink-950 hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(155,227,138,0.45)]',
  danger: 'bg-panel text-red-700 border border-red-200 hover:bg-red-50 hover:border-red-400 hover:shadow-[0_0_18px_rgba(224,122,122,0.35)]',
  dark: 'bg-ink-900 text-white hover:bg-ink-800',
};
const SIZE = {
  sm: 'min-h-[36px] px-3 text-[13px] gap-1.5',
  md: 'min-h-[42px] px-4 text-sm gap-2',
  lg: 'min-h-[48px] px-5 text-[15px] gap-2',
};

export function Button({ variant = 'primary', size = 'md', icon: Icon, className, children, type = 'button', ...rest }) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.97 }}
      className={cx(
        'inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold transition-[background-color,border-color,box-shadow,color,transform] duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50',
        BTN[variant], SIZE[size], className,
      )}
      {...rest}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />}
      {children}
    </motion.button>
  );
}

// ---------- surfaces ----------
export function Card({ className, children, hover = false, ...rest }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={hover ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cx('min-w-0 rounded-2xl border border-slate-200/80 shadow-card', !/(^|\s)bg-/.test(className || '') && 'bg-panel', hover && 'transition-[box-shadow,border-color] hover:border-brand-300 hover:shadow-lift', className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function SectionTitle({ title, sub, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-[16px] font-semibold text-slate-900">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-slate-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------- badges ----------
const TONES = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  submitted: 'bg-brand-50 text-brand-700 ring-brand-200',
  verified: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  pass: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  open: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
  fail: 'bg-red-50 text-red-700 ring-red-200',
  missed: 'bg-red-50 text-red-700 ring-red-200',
  closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  not_submitted: 'bg-slate-100 text-slate-600 ring-slate-200',
  member: 'bg-slate-100 text-slate-700 ring-slate-200',
  lead: 'bg-violet-50 text-violet-700 ring-violet-200',
  admin: 'bg-rose-50 text-rose-700 ring-rose-300',
  late: 'bg-orange-50 text-orange-700 ring-orange-200',
  leave: 'bg-sky-50 text-sky-700 ring-sky-200',
  inactive: 'bg-slate-100 text-slate-500 ring-slate-200',
};
const LABELS = {
  not_submitted: 'Not submitted', pass: 'Pass', fail: 'Fail', lead: 'Club lead', leave: 'On leave',
};
export function Badge({ tone, children, dot = false, className }) {
  const label = children ?? LABELS[tone] ?? (tone ? tone.charAt(0).toUpperCase() + tone.slice(1) : '');
  return (
    <motion.span
      layout
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', TONES[tone] || TONES.closed, className)}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {label}
    </motion.span>
  );
}

// ---------- avatar ----------
const AV = ['bg-brand-100 text-brand-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-800', 'bg-sky-100 text-sky-700', 'bg-rose-100 text-rose-700'];
export const initials = (name = '') => name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
export function Avatar({ name, photo, size = 36, className }) {
  const tone = AV[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AV.length];
  const style = { width: size, height: size, fontSize: Math.max(11, size * 0.36) };
  if (photo) return <img src={photo} alt="" style={style} className={cx('shrink-0 rounded-full object-cover', className)} />;
  return (
    <span style={style} className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', tone, className)} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

// ---------- numbers and bars ----------
export function AnimatedNumber({ value, suffix = '', className, style }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const prev = useRef(0);
  useEffect(() => {
    if (!inView || value == null || !ref.current) return;
    const node = ref.current;
    const controls = animate(prev.current, value, {
      duration: 0.9,
      ease,
      onUpdate: (v) => { node.textContent = `${Math.round(v)}${suffix}`; },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, inView, suffix]);
  return <span ref={ref} className={className} style={style}>{value == null ? '–' : `0${suffix}`}</span>;
}

export function ProgressBar({ value, tone = 'brand', className, height = 8 }) {
  const color = { brand: 'bg-brand-600 shadow-[0_0_10px_rgba(62,230,200,0.7)]', green: 'bg-emerald-500 shadow-[0_0_10px_rgba(155,227,138,0.6)]', amber: 'bg-amber-500 shadow-[0_0_10px_rgba(242,181,68,0.6)]', red: 'bg-red-500 shadow-[0_0_10px_rgba(224,122,122,0.6)]' }[tone];
  return (
    <div className={cx('w-full overflow-hidden rounded-full bg-slate-100', className)} style={{ height }} role="presentation">
      <motion.div
        className={cx('h-full rounded-full', color)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }}
        transition={{ duration: 0.9, ease, delay: 0.1 }}
      />
    </div>
  );
}

// Circular progress ring with a number inside.
export function Ring({ value, size = 120, stroke = 10, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value == null ? 0 : value;
  const color = pct >= 75 ? '#3EE6C8' : '#F2B544';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#0E2A35" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={{ duration: 1.1, ease }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <AnimatedNumber value={value} suffix="%" className="font-display font-bold text-slate-900" style={{ fontSize: Math.round(size * 0.2) }} />
        {label && <span className="text-[11px] font-medium text-slate-500">{label}</span>}
      </div>
    </div>
  );
}

// ---------- empty state ----------
export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      {Icon && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </motion.div>
      )}
      <p className="font-semibold text-slate-800">{title}</p>
      {text && <p className="max-w-sm text-sm text-slate-500">{text}</p>}
      {action}
    </div>
  );
}

// ---------- form fields ----------
export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cx('label', className)}>
      {label}
      {children}
      {hint && !error && <span className="text-xs font-normal text-slate-500">{hint}</span>}
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

// ---------- modal ----------
export function Modal({ open, onClose, title, children, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            className="relative w-full rounded-2xl border border-brand-300/70 bg-panel p-6 shadow-lift"
            style={{ maxWidth: width }}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="font-display text-lg font-semibold text-slate-900">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="-m-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
