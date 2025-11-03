import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { authService } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

export const TopBar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of Vyapti",
    });
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 bg-gradient-subtle border-b border-border shadow-card">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo - Left aligned */}
        <div 
          className="flex items-center cursor-pointer transition-smooth hover:opacity-80"
          onClick={() => navigate('/dashboard')}
        >
          <img 
            src={logo} 
            alt="Vyapti" 
            className="h-8 w-auto"
          />
        </div>

        {/* Logout Button - Right aligned */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="financial-body transition-colors hover:bg-red-500 hover:text-white"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
};

