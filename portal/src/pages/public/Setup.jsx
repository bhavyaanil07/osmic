// Shown when the portal hasn't been connected to Supabase yet.
import { Logo } from '../../components/Logo';

export default function Setup() {
  return (
    <div className="cyber-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[560px] rounded-3xl border border-slate-200 bg-panel p-7 shadow-lift">
        <Logo sub="CLUB PORTAL" />
        <h1 className="mt-8 font-display text-2xl font-semibold">The portal is almost ready</h1>
        <p className="mt-3 text-slate-600">
          It isn&apos;t connected to its database yet. Follow the setup guide in the <span className="font-mono text-slate-800">osmic</span> repository
          (file <span className="font-mono text-slate-800">SETUP.md</span>), then run the <b>Deploy OSMIC site</b> workflow again.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Running it on your own computer? Create <span className="font-mono">portal/.env.local</span> with
          <span className="font-mono"> VITE_SUPABASE_URL</span> and <span className="font-mono">VITE_SUPABASE_KEY</span>, then restart <span className="font-mono">npm run dev</span>.
        </p>
      </div>
    </div>
  );
}
