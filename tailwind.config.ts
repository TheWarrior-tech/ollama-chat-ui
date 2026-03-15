import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#171717',
        chat: '#212121',
        input: '#2f2f2f',
        accent: '#10a37f',
        'accent-hover': '#0d8a6b',
        border: '#383838',
        muted: '#8e8ea0'
      }
    }
  },
  plugins: []
};

export default config;
