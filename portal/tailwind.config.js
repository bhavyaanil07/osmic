/** @type {import('tailwindcss').Config} */

// Dark theme matching the OSMIC website (bhavyaanil07/osmic).
// The usual Tailwind colour names are re-mapped for a dark background:
// low numbers (50, 100, 200) are now dark tints and high numbers (700, 800, 900) are bright,
// so classes like `bg-slate-50`, `text-slate-900` or `bg-emerald-50 text-emerald-700`
// automatically read well on black.

const tint = (c) => ({
  50: c[0], 100: c[1], 200: c[2], 300: c[3], 400: c[4], 500: c[5], 600: c[6], 700: c[7], 800: c[8], 900: c[9],
});

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        display: ['Unbounded', '"Arial Black"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Same palette as the OSMIC website: backwater night, bioluminescent cyan, oil-lamp amber.
        panel: '#0B2530',
        ink: { 950: '#041015', 900: '#06161D', 800: '#0B2530', 700: '#0D3340', 600: '#134250' },
        // Neutral greys, flipped: 50 = page background (#06161d), 700 = mist (#c9d6d8), 900 = paper (#eef3f2).
        slate: tint(['#06161D', '#0E2A35', '#163541', '#1F4552', '#7E9A9F', '#9FB4B7', '#B5C6C8', '#C9D6D8', '#DEE7E6', '#EEF3F2']),
        // Main accent: glow cyan #3ee6c8.
        brand: tint(['#08302D', '#0A3F3A', '#0F5C53', '#18806F', '#5FEBD2', '#52E9CE', '#3EE6C8', '#8AF1DF', '#B5F6EA', '#DBFBF5']),
        // Second accent: lamp amber #f2b544.
        signal: '#F2B544',
        emerald: tint(['#142B17', '#19361C', '#255229', '#336F38', '#ADE89F', '#A4E594', '#9BE38A', '#C1EEB6', '#D8F4D1', '#ECFAE8']),
        amber: tint(['#2E2410', '#3A2D13', '#5C471C', '#806227', '#F5C266', '#F4BC55', '#F2B544', '#F7D08A', '#FAE0B1', '#FCF0D8']),
        red: tint(['#33191B', '#3F1F21', '#5E2F31', '#804043', '#F29B9B', '#F08C8C', '#EE7B7B', '#F5B5B5', '#F9CFCF', '#FCE7E7']),
        violet: tint(['#221F38', '#2A2645', '#403A66', '#58508A', '#B7AEEB', '#AFA5E8', '#A398E3', '#CEC8F1', '#E0DCF6', '#F0EEFB']),
        sky: tint(['#0D2A38', '#103445', '#174E66', '#206A8A', '#8ED6F2', '#7FD0EF', '#6CC8EC', '#B4E4F6', '#D0EEF9', '#E8F7FC']),
        orange: tint(['#33231A', '#3F2A1E', '#5E3F2C', '#80553A', '#F5B28A', '#F3A67A', '#F09766', '#F8CBB0', '#FBDDCB', '#FDEEE5']),
        rose: tint(['#2E2410', '#3A2D13', '#5C471C', '#806227', '#F5C266', '#F4BC55', '#F2B544', '#F7D08A', '#FAE0B1', '#FCF0D8']),
      },
      boxShadow: {
        card: '0 1px 0 rgba(238, 243, 242, 0.03) inset, 0 14px 34px -18px rgba(0, 0, 0, 0.8)',
        lift: '0 0 0 1px rgba(62, 230, 200, 0.3), 0 18px 40px -16px rgba(62, 230, 200, 0.28)',
        glow: '0 10px 30px -10px rgba(62, 230, 200, 0.7)',
        'glow-pink': '0 10px 30px -10px rgba(242, 181, 68, 0.6)',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -30px) scale(1.08)' },
          '66%': { transform: 'translate(-30px, 20px) scale(0.95)' },
        },
        gridmove: { from: { backgroundPosition: '0 0' }, to: { backgroundPosition: '48px 48px' } },
        blink: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0 } },
        scan: { from: { transform: 'translateY(-100%)' }, to: { transform: 'translateY(100%)' } },
        flow: { to: { strokeDashoffset: '-400' } },
      },
      animation: {
        drift: 'drift 18s ease-in-out infinite',
        'drift-slow': 'drift 26s ease-in-out infinite reverse',
        gridmove: 'gridmove 6s linear infinite',
        blink: 'blink 1s step-end infinite',
        scan: 'scan 6s linear infinite',
        flow: 'flow 14s linear infinite',
        'flow-slow': 'flow 22s linear infinite',
      },
    },
  },
  plugins: [],
};
