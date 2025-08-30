import { Button } from '@/components/ui/button';
import { Bell, Users, LogOut } from 'lucide-react';
import { authService } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

export const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of Vyapti",
    });
    navigate('/login');
  };

  const handleNotifications = () => {
    toast({
      title: "Coming Soon",
      description: "Notifications feature will be available soon",
    });
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
            <span className="financial-heading text-xl">Vyapti</span>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTriggers}
              className="financial-body hover:bg-secondary/80"
            >
              <Users className="h-4 w-4 mr-2" />
              Triggers
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNotifications}
              className="relative hover:bg-secondary/80"
            >
              <Bell className="h-4 w-4" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"></div>
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