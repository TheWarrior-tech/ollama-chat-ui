import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#050508',
        sidebar: '#08080e',
        surface: '#0e0e18',
        elevated: '#13131f',
        card: '#16162a',
        border: 'rgba(255,255,255,0.06)',
        'border-med': 'rgba(255,255,255,0.09)',
        'border-high': 'rgba(255,255,255,0.14)',
        accent: '#6366f1',
        'accent-light': '#818cf8',
        'accent-dim': '#4f46e5',
        violet: '#8b5cf6',
        muted: '#4a4a6a',
        'muted-light': '#7878a0',
        text: '#e8e8f0',
        'text-dim': '#9898b8',
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(99,102,241,0.25)',
        'glow-md': '0 0 24px rgba(99,102,241,0.3)',
        'glow-lg': '0 0 40px rgba(99,102,241,0.2)',
        'card': '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'gradient-subtle': 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
      },
    },
  },
  plugins: [],
};
export default config;
