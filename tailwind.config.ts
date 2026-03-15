import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        sidebar: '#0f0f0f',
        surface: '#141414',
        elevated: '#1a1a1a',
        border: '#222222',
        'border-light': '#2a2a2a',
        accent: '#7c7cff',
        'accent-dim': '#5a5aee',
        muted: '#666',
        'muted-light': '#888',
        text: '#e8e8e8',
        'text-dim': '#aaa',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
