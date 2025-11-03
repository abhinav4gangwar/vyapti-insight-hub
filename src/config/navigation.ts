import { Building2, FileText, Search, BellRing, Database, Bell, LucideIcon } from 'lucide-react';

export interface NavigationItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    key: 'company-search',
    label: 'Company Search',
    href: '/dashboard',
    icon: Building2,
  },
  {
    key: 'expert-interviews',
    label: 'Expert Interviews',
    href: '/expert-interviews',
    icon: FileText,
  },
  {
    key: 'ai-search',
    label: 'AI Search',
    href: '/ai-search',
    icon: Search,
  },
  {
    key: 'triggers',
    label: 'Triggers',
    href: '/triggers',
    icon: BellRing,
  },
  {
    key: 'data-catalogue',
    label: 'Data Catalogue',
    href: '/data-catalogue',
    icon: Database,
  },
  {
    key: 'notifications',
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
] as const;

