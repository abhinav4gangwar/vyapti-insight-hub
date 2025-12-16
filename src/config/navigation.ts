import { Bell, BellRing, Building2, Clipboard, Database, FileText, LucideIcon, Search, Settings, Sparkles } from 'lucide-react';

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
    key: 'prompt-triggers',
    label: 'Prompt Triggers',
    href: '/prompt-triggers',
    icon: Sparkles,
  },
  {
    key: 'data-catalogue',
    label: 'Data Catalogue',
    href: '/data-catalogue',
    icon: Database,
  },
  {
    key:'anti-dumping-duties',
    label:"Anti Dumping Duties",
    href:"/dgtr-db",
    icon: Clipboard,
  },
  {
    key: 'notifications',
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
] as const;

