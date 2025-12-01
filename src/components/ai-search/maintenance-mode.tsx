import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Clock, Wrench } from "lucide-react";
import { AIServiceStatus } from "@/hooks/use-ai-service-status";

interface MaintenanceModeProps {
  serviceStatus: AIServiceStatus | null;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function MaintenanceMode({ serviceStatus, onRetry, isRetrying = false }: MaintenanceModeProps) {
  const formatUpdatedAt = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-2xl mx-auto shadow-lg border-0">
        <CardContent className="text-center py-16 px-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Wrench className="h-16 w-16 text-orange-500" />
              <AlertTriangle className="h-8 w-8 text-red-500 absolute -top-2 -right-2" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            AI Service Under Maintenance
          </h2>

          {/* Message */}
          <div className="space-y-4 mb-8">
            <p className="text-lg text-gray-600">
              {serviceStatus?.message || 'The AI search service is currently unavailable for maintenance.'}
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>
                  Last updated: {serviceStatus?.updated_at ? formatUpdatedAt(serviceStatus.updated_at) : 'Unknown'}
                </span>
              </div>
              
              {serviceStatus?.service_name && (
                <div className="text-sm text-gray-500">
                  Service: {serviceStatus.service_name}
                </div>
              )}
            </div>
          </div>

          {/* What to expect */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">What's happening?</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• AI search functionality is temporarily disabled</li>
              <li>• Our team is working to restore service as quickly as possible</li>
              <li>• All other features remain fully functional</li>
              <li>• No data has been lost during this maintenance</li>
            </ul>
          </div>

          {/* Retry button */}
          <Button 
            onClick={onRetry}
            disabled={isRetrying}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking Status...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Status Again
              </>
            )}
          </Button>

          {/* Additional help */}
          <p className="text-sm text-gray-500 mt-6">
            If this issue persists, please contact our support team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
