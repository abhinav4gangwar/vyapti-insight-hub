import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, Building2, FileText, ExternalLink, CheckCircle } from 'lucide-react';
import { authService } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getDocumentUrl, isPdfUrl } from '@/lib/document-utils';

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  data: {
    trigger_ids: number[];
    company_names: string[];
    company_details: any[];
    job_type: string;
    job_run_date: string;
    trigger_count: number;
  };
  status: string;
  email_sent: boolean;
  created_at: string;
  updated_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const client = authService.createAuthenticatedClient();
        console.log('Making request to:', client.defaults.baseURL + '/notifications');
        const response = await client.get('/notifications');
        setNotifications(response.data.notifications);
      } catch (error) {
        console.error('Failed to load notifications:', error);
        if (error.code === 'ERR_NETWORK') {
          toast({
            title: "Network Error",
            description: "Unable to connect to the server. Please check if the backend is running and CORS is configured.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to load notifications",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId: number) => {
    try {
      const client = authService.createAuthenticatedClient();
      await client.post(`/notifications/${notificationId}/read`);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'read' }
            : notif
        )
      );
      
      toast({
        title: "Marked as read",
        description: "Notification has been marked as read",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const openDocument = (url: string, documentDate?: string) => {
    if (!url) return;

    // Apply document URL transformation for PDF links
    const processedUrl = isPdfUrl(url)
      ? getDocumentUrl(url, undefined, documentDate)
      : url;

    window.open(processedUrl, '_blank');
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="financial-heading text-3xl mb-2 flex items-center">
            <Bell className="h-8 w-8 mr-3 text-accent" />
            Notifications
          </h1>
          <p className="financial-body">
            Stay updated with the latest activity and document releases
          </p>
        </div>

        {/* Notifications */}
        <Card className="shadow-card border-0 animate-slide-up">
          <CardHeader>
            <CardTitle className="financial-heading">Recent Activity</CardTitle>
            <CardDescription className="financial-body">
              Latest notifications from your tracked companies and triggers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-smooth ${
                      notification.status === 'unread' 
                        ? 'bg-accent/5 border-accent/20' 
                        : 'bg-secondary/10 border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="financial-subheading">{notification.title}</h3>
                          {notification.status === 'unread' && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="financial-body text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(notification.created_at)}
                          </span>
                          <span>Type: {notification.notification_type}</span>
                          <span>Companies: {notification.data.trigger_count}</span>
                        </div>
                      </div>
                      
                      {notification.status === 'unread' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="ml-4"
                        >
                          <CheckCircle className="h-3 w-3 mr-2" />
                          Mark as Read
                        </Button>
                      )}
                    </div>

                    {/* Company Details */}
                    {notification.data.company_details && notification.data.company_details.length > 0 && (
                      <div className="border-t border-border pt-4 space-y-3">
                        <h4 className="financial-subheading text-sm">Company Details:</h4>
                        <div className="grid gap-3">
                          {notification.data.company_details.map((company: any, index: number) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-secondary/20 rounded-lg">
                              <Building2 className="h-4 w-4 text-accent mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="financial-subheading text-sm">{company.name}</h5>
                                  <Badge variant="outline" className="text-xs">
                                    {company.source?.includes('bse') ? 'BSE' : company.source?.includes('nse') ? 'NSE' : 'Unknown'}
                                  </Badge>
                                </div>
                                <p className="financial-body text-xs text-muted-foreground mb-2">
                                  {company.title}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="financial-body text-xs flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(company.date)}
                                  </span>
                                  {company.url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openDocument(company.url, company.date)}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="financial-subheading mb-2">No Notifications</h3>
                <p className="financial-body">
                  You have no notifications at this time
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}