import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export const useTokenExpiration = () => {
  useEffect(() => {
    const handleTokenExpiration = (event: CustomEvent) => {
      toast({
        title: "Session Expired",
        description: event.detail.message || "Your session has expired. Please log in again.",
        variant: "destructive",
      });
    };

    // Listen for token expiration events
    window.addEventListener('tokenExpired', handleTokenExpiration as EventListener);

    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpiration as EventListener);
    };
  }, []);
};
