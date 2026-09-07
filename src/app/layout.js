import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'WeatherAction — Weather Decision Intelligence',
  description:
    'Convert raw weather data into GO / CAUTION / AVOID decisions for outdoor activities. Built for Tamil Nadu regions with hyperlocal micro-zone risk scoring.',
  keywords: ['weather', 'decision', 'outdoor activities', 'Tamil Nadu', 'risk assessment'],
  openGraph: {
    title: 'WeatherAction',
    description: 'Weather Decision Intelligence for outdoor activities',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#0EA5E9" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌦️</text></svg>" />
      </head>
      <body className="font-sans bg-slate-50 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
