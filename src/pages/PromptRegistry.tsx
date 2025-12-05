import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Edit, History, Search, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';
import { Prompt, getAllPrompts } from '@/lib/prompt-api';
import { EditPromptDialog } from '@/components/prompts/edit-prompt-dialog';
import { ViewHistoryDialog } from '@/components/prompts/view-history-dialog';

export default function PromptRegistry() {
  const navigate = useNavigate();
  const isAuthorized = authService.isPromptRegistryAuthorized();

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  // Redirect unauthorized users
  useEffect(() => {
    if (!isAuthorized) {
      navigate('/');
    }
  }, [isAuthorized, navigate]);

  // Fetch prompts
  useEffect(() => {
    if (isAuthorized) {
      fetchPrompts();
    }
  }, [isAuthorized]);

  // Filter prompts based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPrompts(prompts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = prompts.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.prompt_type.toLowerCase().includes(query) ||
          p.provider.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
      setFilteredPrompts(filtered);
    }
  }, [searchQuery, prompts]);

  const fetchPrompts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAllPrompts();
      setPrompts(data);
      setFilteredPrompts(data);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch prompts');
      toast({
        title: 'Error',
        description: 'Failed to fetch prompts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setEditDialogOpen(true);
  };

  const handleViewHistory = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setHistoryDialogOpen(true);
  };

  const handleSuccess = () => {
    fetchPrompts();
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toUpperCase()) {
      case 'GPT':
        return 'bg-green-100 text-green-800';
      case 'CLAUDE':
        return 'bg-purple-100 text-purple-800';
      case 'GEMINI':
        return 'bg-blue-100 text-blue-800';
      case 'UNIVERSAL':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DEFAULT_SYSTEM':
        return 'bg-blue-100 text-blue-800';
      case 'QUERY_EXPANSION':
        return 'bg-yellow-100 text-yellow-800';
      case 'CORE_SYSTEM':
        return 'bg-indigo-100 text-indigo-800';
      case 'WEIGHT_INSTRUCTIONS':
        return 'bg-orange-100 text-orange-800';
      case 'QUERY_EXTRACTION':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Prompt Registry</h1>
          <p className="text-gray-600 mt-1">Manage AI service prompts and their versions</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, type, provider, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prompts List */}
        {!isLoading && !error && filteredPrompts.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-gray-600">
                {searchQuery ? 'No prompts found matching your search' : 'No prompts available'}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && filteredPrompts.length > 0 && (
          <div className="space-y-4">
            {filteredPrompts.map((prompt) => (
              <Card key={prompt.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Prompt Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{prompt.name}</h3>
                        <Badge variant="outline">v{prompt.version}</Badge>
                        <Badge className={getProviderColor(prompt.provider)}>
                          {prompt.provider}
                        </Badge>
                        <Badge className={getTypeColor(prompt.prompt_type)}>
                          {prompt.prompt_type}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600">{prompt.description}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>ID: {prompt.id}</span>
                        <span>•</span>
                        <span>Updated: {new Date(prompt.updated_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>By: {prompt.updated_by}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewHistory(prompt)}
                      >
                        <History className="h-4 w-4 mr-2" />
                        History
                      </Button>
                      <Button size="sm" onClick={() => handleEdit(prompt)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <EditPromptDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        prompt={selectedPrompt}
        onSuccess={handleSuccess}
      />

      <ViewHistoryDialog
        isOpen={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        prompt={selectedPrompt}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

