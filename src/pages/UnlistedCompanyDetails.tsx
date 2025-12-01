import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, FileText, Calendar, Clock, Users, Tag } from 'lucide-react';
import { authService } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

interface ExpertInterview {
  id: number;
  title: string;
  published_date: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  expert_type: string;
  est_read: number;
  read_time: number | null;
  primary_isin: string | null;
  secondary_isins: string[];
  industry: string;
  sub_industries: string[];
  primary_companies: string[];
  secondary_companies: string[];
}

interface UnlistedCompanyData {
  name: string;
  expert_interviews: ExpertInterview[];
}

export default function UnlistedCompanyDetails() {
  const { companyName } = useParams<{ companyName: string }>();
  const [companyData, setCompanyData] = useState<UnlistedCompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyName) return;

      try {
        const client = authService.createAuthenticatedClient();
        const response = await client.get(`/companies/unlisted/${encodeURIComponent(companyName)}`);
        setCompanyData(response.data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load company details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyName]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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

  if (!companyData) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-card border-0">
            <CardContent className="text-center py-16">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="financial-heading mb-2">Company Not Found</h2>
              <p className="financial-body">The requested unlisted company could not be found.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Header */}
        <Card className="shadow-card border-0 mb-8 animate-fade-in">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="financial-heading text-2xl mb-2 flex items-center">
                  <Building2 className="h-6 w-6 mr-3 text-accent" />
                  {companyData.name}
                  <span className="ml-3 px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
                    Unlisted
                  </span>
                </CardTitle>
                <CardDescription className="financial-body">
                  No ISIN available for unlisted company
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Expert Interviews */}
        <Card className="shadow-card border-0 mb-8">
          <CardHeader>
            <CardTitle className="financial-heading flex items-center">
              <Users className="h-5 w-5 mr-2 text-accent" />
              Expert Interviews ({companyData.expert_interviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {companyData.expert_interviews.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="financial-body">No expert interviews available for this company.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {companyData.expert_interviews.map((interview) => (
                  <div key={interview.id} className="border border-border rounded-lg p-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="financial-subheading text-base font-medium pr-4">
                        {interview.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                        <Calendar className="h-3 w-3" />
                        {formatDate(interview.published_date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {interview.expert_type}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {interview.est_read} min read
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {interview.industry}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
