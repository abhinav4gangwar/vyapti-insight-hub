import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Prompt, updatePrompt } from '@/lib/prompt-api';

interface EditPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
  onSuccess: () => void;
}

export function EditPromptDialog({ isOpen, onClose, prompt, onSuccess }: EditPromptDialogProps) {
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when prompt changes
  useEffect(() => {
    if (prompt) {
      setContent(prompt.content);
      setDescription(prompt.description);
      setReason('');
    }
  }, [prompt]);

  const handleSubmit = async () => {
    if (!prompt) return;

    if (!content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Prompt content cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePrompt(prompt.id, {
        content: content.trim(),
        description: description.trim() || undefined,
        reason: reason.trim() || undefined,
      });

      toast({
        title: 'Success',
        description: 'Prompt updated successfully',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating prompt:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update prompt',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!prompt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Prompt
            <Badge variant="outline" className="ml-2">
              v{prompt.version}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Prompt Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium text-gray-900">{prompt.prompt_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Provider</p>
              <p className="font-medium text-gray-900">{prompt.provider}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium text-gray-900">{prompt.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="font-medium text-gray-900">
                {new Date(prompt.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this prompt"
              disabled={isSubmitting}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Prompt Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter prompt content..."
              className="min-h-[300px] font-mono text-sm"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              {content.length} characters
            </p>
          </div>

          {/* Reason for Change */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're making this change..."
              className="min-h-[80px]"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

