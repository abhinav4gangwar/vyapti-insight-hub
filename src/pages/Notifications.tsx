import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, Building2, FileText, ExternalLink } from 'lucide-react';

export default function Notifications() {
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
            <div className="text-center py-16">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="financial-subheading mb-2">Coming Soon</h3>
              <p className="financial-body mb-6">
                Real-time notifications and activity tracking will be available here
              </p>
              
              {/* Preview of what notifications will look like */}
              <div className="max-w-md mx-auto text-left space-y-3 border border-dashed border-border rounded-lg p-4">
                <div className="financial-body text-xs text-muted-foreground text-center mb-4">
                  Preview
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-secondary/20 rounded-lg">
                  <FileText className="h-4 w-4 text-accent mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="financial-subheading text-sm">New Earnings Call</h4>
                      <Badge variant="outline" className="text-xs">New</Badge>
                    </div>
                    <p className="financial-body text-xs text-muted-foreground mb-2">
                      Reliance Industries Ltd released Q3 earnings call transcript
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="financial-body text-xs flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        2 hours ago
                      </span>
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                        View
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-secondary/10 rounded-lg">
                  <Building2 className="h-4 w-4 text-accent mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="financial-subheading text-sm">Trigger Activated</h4>
                      <Badge variant="secondary" className="text-xs">Trigger</Badge>
                    </div>
                    <p className="financial-body text-xs text-muted-foreground mb-2">
                      First document trigger activated for TCS Ltd
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="financial-body text-xs flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        5 hours ago
                      </span>
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}