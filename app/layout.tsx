import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeuralChat',
  description: 'Local AI Chat powered by Ollama'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
