import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { NAVIGATION_ITEMS } from '@/config/navigation';
import { authService } from '@/lib/auth';
import { ChevronLeft, ChevronRight, Search as SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const client = authService.createAuthenticatedClient();
        const response = await client.get('/notifications/unread-count');
        setUnreadCount(response.data.unread_count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    if (authService.isAuthenticated()) {
      fetchUnreadCount();
      
      // Poll every 30 seconds for new notifications
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // Filter navigation items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return NAVIGATION_ITEMS;
    }
    
    const query = searchQuery.toLowerCase();
    return NAVIGATION_ITEMS.filter(item => 
      item.label.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Helper function to determine if a route is active
  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || 
             location.pathname === '/' || 
             location.pathname.startsWith('/companies');
    }
    return location.pathname.startsWith(href);
  };

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        {/* Toggle Button */}
        <div className="flex items-center justify-between px-2 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
            aria-label={state === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={state === 'expanded'}
          >
            {state === 'expanded' ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search Input - Only visible when expanded */}
        {state === 'expanded' && (
          <div className="px-2 pb-2">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 bg-background"
              />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.href);
                  const showBadge = item.key === 'notifications' && unreadCount > 0;

                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        onClick={() => handleNavigation(item.href)}
                        isActive={isActive}
                        tooltip={state === 'collapsed' ? item.label : undefined}
                        className="relative"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {showBadge && state === 'expanded' && (
                          <Badge
                            variant="default"
                            className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-accent text-white"
                          >
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              ) : (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {state === 'expanded' ? 'No results found' : ''}
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

