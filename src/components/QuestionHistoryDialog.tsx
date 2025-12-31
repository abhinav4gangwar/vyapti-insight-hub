import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { History, RotateCcw, Clock } from 'lucide-react';
import {
  getQuestionHistory,
  restoreQuestionVersion,
} from '@/lib/prompt-triggers-api';
import type { PromptTriggerQuestionHistory, SourceShorthand } from '@/types/prompt-triggers';

const SOURCE_LABELS: Record<SourceShorthand, string> = {
  A: 'All',
  K: 'Expert Call',
  E: 'Earnings Call',
};

interface QuestionHistoryDialogProps {
  questionId: number | null;
  questionText: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestored?: () => void;
}

export function QuestionHistoryDialog({
  questionId,
  questionText,
  open,
  onOpenChange,
  onRestored,
}: QuestionHistoryDialogProps) {
  const [history, setHistory] = useState<PromptTriggerQuestionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (open && questionId) {
      loadHistory();
    }
  }, [open, questionId]);

  const loadHistory = async () => {
    if (!questionId) return;

    setIsLoading(true);
    try {
      const data = await getQuestionHistory(questionId);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load question history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load question history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (historyId: number, version: number) => {
    if (!questionId) return;

    setIsRestoring(true);
    try {
      await restoreQuestionVersion(questionId, {
        history_id: historyId,
        reason: `Restored to version ${version}`,
      });

      toast({
        title: '✓ Question Restored',
        description: `Successfully restored to version ${version}`,
      });

      onRestored?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to restore question:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore question version',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Question History
          </DialogTitle>
          <DialogDescription>
            View and restore previous versions of: "{questionText}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No history available for this question</p>
            </div>
          ) : (
            <>
              {history.map((entry, index) => (
                <Card key={entry.id} className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-sm font-medium">
                          Version {entry.version}
                        </CardTitle>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Previous Version
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {SOURCE_LABELS[entry.source_shorthand as SourceShorthand]}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(entry.id, entry.version)}
                        disabled={isRestoring}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Question Text */}
                    <div>
                      <Label className="text-xs text-muted-foreground">Question</Label>
                      <p className="text-sm mt-1">{entry.question_text}</p>
                    </div>

                    {/* Group Name */}
                    <div>
                      <Label className="text-xs text-muted-foreground">Group</Label>
                      <p className="text-sm mt-1">{entry.group_name}</p>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground pt-2 border-t">
                      <div>
                        <span className="font-medium">Created:</span>
                        <br />
                        {formatDate(entry.created_at)}
                        {entry.created_by && (
                          <>
                            <br />
                            <span className="text-xs">by {entry.created_by}</span>
                          </>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Replaced:</span>
                        <br />
                        {formatDate(entry.replaced_at)}
                        {entry.replaced_by && (
                          <>
                            <br />
                            <span className="text-xs">by {entry.replaced_by}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Reason for change */}
                    {entry.reason && (
                      <div className="bg-muted/50 p-3 rounded-md">
                        <Label className="text-xs text-muted-foreground">Reason for change</Label>
                        <p className="text-sm mt-1 italic">{entry.reason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
