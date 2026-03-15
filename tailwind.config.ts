import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        sidebar: 'var(--sidebar)',
        surface: 'var(--surface)',
        elevated: 'var(--elevated)',
        card: 'var(--card)',
        border: 'var(--border)',
        'border-med': 'var(--border-med)',
        'border-high': 'var(--border-high)',
        text: 'var(--text)',
        'text-dim': 'var(--text-dim)',
        muted: 'var(--muted)',
        'muted-light': 'var(--muted-light)',
        accent: 'var(--accent)',
        'accent-light': 'var(--accent-light)',
        'accent-dim': 'var(--accent-dim)',
        violet: 'var(--violet)',
      },
      boxShadow: {
        'glow-sm': 'var(--glow-sm)',
        'glow-md': 'var(--glow-md)',
        'card': 'var(--shadow)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'gradient-subtle': 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
      },
    },
  },
  plugins: [],
};
export default config;
