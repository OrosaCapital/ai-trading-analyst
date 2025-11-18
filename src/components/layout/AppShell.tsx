import { ReactNode } from 'react';
import { Topbar } from './Topbar';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};
