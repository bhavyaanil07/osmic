import { motion } from 'framer-motion';

// OSMIC mark: a ring with a glowing core that spins in once.
export function LogoMark({ size = 36 }) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"
      initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
    >
      <defs><linearGradient id="osmic-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3EE6C8" /><stop offset="1" stopColor="#F2B544" /></linearGradient></defs>
      <rect width="64" height="64" rx="14" fill="#06161D" stroke="url(#osmic-g)" strokeWidth="3" />
      <circle cx="32" cy="32" r="15" fill="none" stroke="url(#osmic-g)" strokeWidth="6" />
      <motion.circle
        cx="32" cy="32" r="4" fill="#F2B544"
        animate={{ scale: [1, 1.35, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}

export function Logo({ light = true, sub }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark />
      <div className="flex flex-col leading-tight">
        <span className={`font-display text-lg font-extrabold tracking-[0.12em] ${light ? 'text-white' : 'text-slate-900'}`}>OSMIC</span>
        {sub && <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-brand-600">{sub}</span>}
      </div>
    </div>
  );
}
