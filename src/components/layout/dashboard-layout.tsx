import { ReactNode, useEffect, useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { TopBar } from './top-bar';

interface DashboardLayoutProps {
  children: ReactNode;
}

const SIDEBAR_STORAGE_KEY = 'vyapti.sidebar';

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [open, setOpen] = useState(() => {
    // Initialize from localStorage
    const savedState = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return savedState !== 'collapsed'; // Default to true (expanded) unless explicitly collapsed
  });

  // Save sidebar state to localStorage when it changes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, newOpen ? 'expanded' : 'collapsed');
  };

  return (
    <SidebarProvider open={open} onOpenChange={handleOpenChange}>
      <AppSidebar />
      <SidebarInset>
        <TopBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

