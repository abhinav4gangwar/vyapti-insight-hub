import { useState, useEffect, useCallback } from 'react';

export interface AIServiceStatus {
  service_name: string;
  status: 'up' | 'down';
  message: string;
  service_live: boolean;
  updated_at: string;
}

interface UseAIServiceStatusReturn {
  serviceStatus: AIServiceStatus | null;
  isLoading: boolean;
  error: string | null;
  isServiceLive: boolean;
  checkStatus: () => Promise<void>;
}

export function useAIServiceStatus(
  checkInterval: number = 30000, // Check every 30 seconds by default
  enableAutoCheck: boolean = true
): UseAIServiceStatusReturn {
  const [serviceStatus, setServiceStatus] = useState<AIServiceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      setError(null);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/ai/service-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check service status: ${response.statusText}`);
      }

      const status: AIServiceStatus = await response.json();
      setServiceStatus(status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check AI service status';
      setError(errorMessage);
      console.error('AI Service Status Check Error:', err);
      
      // If we can't reach the service status endpoint, assume service is down
      setServiceStatus({
        service_name: 'ai_service',
        status: 'down',
        message: 'Unable to connect to AI service',
        service_live: false,
        updated_at: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial status check
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Set up periodic status checks
  useEffect(() => {
    if (!enableAutoCheck) return;

    const interval = setInterval(checkStatus, checkInterval);
    return () => clearInterval(interval);
  }, [checkStatus, checkInterval, enableAutoCheck]);

  const isServiceLive = serviceStatus?.service_live ?? false;

  return {
    serviceStatus,
    isLoading,
    error,
    isServiceLive,
    checkStatus,
  };
}
