import { Bell, BellRing, Building2, ChartNoAxesColumnIncreasing, Clipboard, Database, FileText, LayoutList, LucideIcon, Search, Settings, Sparkles, TextSearch } from 'lucide-react';

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
    key: 'company-catalogue',
    label: 'Company Catalogue',
    href: '/company-catalogue',
    icon: ChartNoAxesColumnIncreasing,
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
    key: 'custom-watchlists',
    label: 'Custom Watchlists',
    href: '/custom-watchlists',
    icon: LayoutList,
  },
  {
    key:'anti-dumping-duties',
    label:"Anti Dumping Duties",
    href:"/dgtr-db",
    icon: Clipboard,
  },
  {
    key:'full-text-search',
    label:"Full Text Search",
    href:"/fts",
    icon: TextSearch,
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

