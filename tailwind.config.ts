import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080810',
        sidebar: '#0c0c16',
        surface: '#10101e',
        elevated: '#161624',
        border: '#1e1e32',
        'border-light': '#2a2a40',
        accent: '#7c7cff',
        'accent-dim': '#6060ee',
        muted: '#555570',
        'muted-light': '#8888a8',
        text: '#e2e2e8',
        'text-dim': '#aaaacc',
      },
    },
  },
  plugins: [],
};
export default config;
