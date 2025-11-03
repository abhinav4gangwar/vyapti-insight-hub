import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, Building2, FileText, ExternalLink, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { authService } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


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

interface PaginationInfo {
  current_page: number;
  page_size: number;
  total_pages: number;
  total_items: number;
  has_next: boolean;
  has_prev: boolean;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    page_size: 20,
    total_pages: 1,
    total_items: 0,
    has_next: false,
    has_prev: false
  });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchNotifications = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const client = authService.createAuthenticatedClient();
      const params = new URLSearchParams({
        page: page.toString()
      });

      console.log('Making request to:', client.defaults.baseURL + `/notifications/?${params.toString()}`);
      const response = await client.get(`/notifications/?${params.toString()}`);
      setNotifications(response.data.notifications);
      setPagination(response.data.pagination);
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

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage !== currentPage && newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const client = authService.createAuthenticatedClient();
      await client.put(`/notifications/${notificationId}/read`);
      
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

  const openDocument = (url: string) => {
    window.open(url, '_blank');
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
                                      onClick={() => openDocument(company.url)}
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

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <div className="financial-body text-sm text-muted-foreground">
                  Showing {((pagination.current_page - 1) * pagination.page_size) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.page_size, pagination.total_items)} of{' '}
                  {pagination.total_items} notifications
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={!pagination.has_prev}
                    className="financial-body"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(
                        pagination.total_pages - 4,
                        pagination.current_page - 2
                      )) + i;

                      if (pageNum > pagination.total_pages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.current_page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0 financial-body"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={!pagination.has_next}
                    className="financial-body"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}