'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';
const ThemeContext = createContext<{ theme: Theme; setTheme:(t:Theme)=>void }>({ theme:'system', setTheme:()=>{} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('nc-theme') as Theme | null;
    setThemeState(saved || 'system');
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const apply = (t: Theme) => {
      const root = document.documentElement;
      if (t === 'system') {
        root.setAttribute('data-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      } else {
        root.setAttribute('data-theme', t);
      }
    };
    apply(theme);
    localStorage.setItem('nc-theme', theme);
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const h = () => apply('system');
      mq.addEventListener('change', h);
      return () => mq.removeEventListener('change', h);
    }
  }, [theme, mounted]);

  return <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
