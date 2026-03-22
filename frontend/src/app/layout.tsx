import './globals.css';
import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '@/context/LanguageContext';
import { UserProvider } from '@/context/UserContext';
import { CartProvider } from '@/context/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <UserProvider>
            <LanguageProvider>
              <CartProvider>
                <Header />
                {children}
                <Footer />
                <Toaster position="top-right" />
              </CartProvider>
            </LanguageProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}