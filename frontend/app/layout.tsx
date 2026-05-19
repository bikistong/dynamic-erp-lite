import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dynamic ERP Lite',
  description: 'ERP system untuk UMKM',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
