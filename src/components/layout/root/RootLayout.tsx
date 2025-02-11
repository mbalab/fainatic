import { ReactNode } from 'react';
import { Header } from '../header';
import { Footer } from '../footer';

interface RootLayoutProps {
  children: ReactNode;
}

export const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow mt-16">{children}</main>
      <Footer />
    </div>
  );
};
