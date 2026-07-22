import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { ConsoleWarningSuppressor } from '@/components/console-warning-suppressor';

export const metadata: Metadata = {
  title: 'FinERP — Comptabilité, Logistique & Fiscal Multi-Sites',
  description:
    'ERP financier SYSCOHADA pour le négoce international de ciment. Comptabilité, logistique transfrontalière, fiscalité RDC et reporting OHADA.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ConsoleWarningSuppressor />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
