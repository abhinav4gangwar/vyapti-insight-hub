import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Users, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { authService } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

export const Navbar = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

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

  const handleLogout = () => {
    authService.logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of Vyapti",
    });
    navigate('/login');
  };

  const handleNotifications = () => {
    navigate('/notifications');
  };

  const handleTriggers = () => {
    navigate('/triggers');
  };

  return (
    <nav className="bg-gradient-subtle border-b border-border shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer transition-smooth hover:opacity-80"
            onClick={() => navigate('/dashboard')}
          >
            <img 
              src={logo} 
              alt="Vyapti" 
              className="h-8 w-auto mr-3"
            />
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTriggers}
              className="financial-body hover:bg-blue-500 hover:text-white transition-colors"
            >
              <Users className="h-4 w-4 mr-2" />
              Triggers
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNotifications}
              className="relative hover:bg-blue-500 hover:text-white transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-accent text-white"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="financial-body hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};