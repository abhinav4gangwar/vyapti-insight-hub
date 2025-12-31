import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RotateCcw, Calendar, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Prompt, PromptHistory, getPromptHistory, restorePromptVersion } from '@/lib/prompt-api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ViewHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
  onSuccess: () => void;
}

export function ViewHistoryDialog({ isOpen, onClose, prompt, onSuccess }: ViewHistoryDialogProps) {
  const [history, setHistory] = useState<PromptHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  // Restore confirmation dialog
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<PromptHistory | null>(null);
  const [restoreReason, setRestoreReason] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen && prompt) {
      fetchHistory();
    }
  }, [isOpen, prompt]);

  const fetchHistory = async () => {
    if (!prompt) return;

    setIsLoading(true);
    try {
      const data = await getPromptHistory(prompt.id);
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreClick = (historyItem: PromptHistory) => {
    setSelectedHistory(historyItem);
    setRestoreReason('');
    setRestoreDialogOpen(true);
  };

  const handleRestoreConfirm = async () => {
    if (!prompt || !selectedHistory) return;

    setIsRestoring(true);
    try {
      await restorePromptVersion(prompt.id, {
        history_id: selectedHistory.id,
        reason: restoreReason.trim() || undefined,
      });

      toast({
        title: 'Success',
        description: `Restored to version ${selectedHistory.version}`,
      });

      setRestoreDialogOpen(false);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error restoring prompt:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to restore prompt',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  if (!prompt) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prompt History</DialogTitle>
            <div className="text-sm text-gray-600">
              {prompt.prompt_type} - {prompt.provider} - {prompt.name}
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No history available
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <Card key={item.id} className="border-gray-200">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">v{item.version}</Badge>
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  Replaced on {new Date(item.replaced_at).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <User className="h-3 w-3" />
                                <span>By {item.replaced_by}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreClick(item)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                        </div>

                        {/* Reason */}
                        {item.reason && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <p className="text-xs font-semibold text-blue-900 mb-1">
                              Reason for change:
                            </p>
                            <p className="text-sm text-blue-800">{item.reason}</p>
                          </div>
                        )}

                        {/* Content Preview/Expand */}
                        <div>
                          <button
                            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {expandedId === item.id ? 'Hide' : 'Show'} Content
                          </button>
                          
                          {expandedId === item.id && (
                            <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                                {item.content}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Prompt Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore to version {selectedHistory?.version}? 
              The current version will be saved to history.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="restore-reason">Reason for Restoration (Optional)</Label>
            <Textarea
              id="restore-reason"
              value={restoreReason}
              onChange={(e) => setRestoreReason(e.target.value)}
              placeholder="Explain why you're restoring this version..."
              className="min-h-[80px]"
              disabled={isRestoring}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreConfirm} disabled={isRestoring}>
              {isRestoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Restore Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

