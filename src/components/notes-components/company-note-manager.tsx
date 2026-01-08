import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { CompanyNote, notesApi } from '@/lib/notes-api';
import { ArrowUpDown, FileText, Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { authService } from '@/lib/auth';
import { NoteDisplay } from './note-display';
import { RichTextEditor } from './text-editor';

interface CompanyNotesManagerProps {
  isin: string;
}

export function CompanyNotesManager({ isin }: CompanyNotesManagerProps) {
  const [notes, setNotes] = useState<CompanyNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDeletingNote, setIsDeletingNote] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const user = authService.getUser();

  const loadNotes = async (order: 'asc' | 'desc' = sortOrder) => {
    try {
      setIsLoading(true);
      const notesData = await notesApi.getNotes(isin, order);
      setNotes(notesData);
    } catch (error) {
      console.error('Failed to load notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load research notes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [isin]);

  const handleSubmit = async (content: any) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create notes',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newNote = await notesApi.createNote(isin, {
        content,
        user_id: String(user.id),
        username: user.username,
      });

      // Add new note to the list based on sort order
      if (sortOrder === 'desc') {
        setNotes([newNote, ...notes]);
      } else {
        setNotes([...notes, newNote]);
      }

      toast({
        title: 'Note Created',
        description: 'Your research note has been saved successfully',
      });

      // Close dialog after successful submission
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create note:', error);
      toast({
        title: 'Error',
        description: 'Failed to create research note',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    setIsDeletingNote(noteId);
    try {
      await notesApi.deleteNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
      toast({
        title: 'Note Deleted',
        description: 'Research note has been permanently deleted',
      });
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete research note',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingNote(null);
    }
  };

  const handleSortChange = (newOrder: 'asc' | 'desc') => {
    setSortOrder(newOrder);
    loadNotes(newOrder);
  };

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="financial-heading flex items-center">
              <FileText className="h-5 w-5 mr-2 text-accent" />
              Research Timeline
              <Badge variant="outline" className="ml-2 financial-body">
                {notes.length}
              </Badge>
            </CardTitle>
            <CardDescription className="financial-body mt-1">
              Chronological timeline of research notes and observations
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortOrder} onValueChange={handleSortChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">
                  <div className="flex items-center">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Newest First
                  </div>
                </SelectItem>
                <SelectItem value="asc">
                  <div className="flex items-center">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Oldest First
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="financial-body gap-2">
                  <Plus className="h-4 w-4" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle className="financial-heading">Create Research Note</DialogTitle>
                  <DialogDescription className="financial-body">
                    Add your analysis, observations, or research findings. Notes are timestamped and immutable.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <RichTextEditor 
                    onSubmit={handleSubmit} 
                    isSubmitting={isSubmitting}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <NoteDisplay
                key={note.id}
                note={note}
                currentUserId={user ? String(user.id) : undefined}
                onDelete={handleDelete}
                isDeletingNote={isDeletingNote}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="financial-subheading mb-2">No Research Notes Yet</h3>
            <p className="financial-body mb-4">
              Be the first to add research notes for this company
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="financial-body gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Note
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle className="financial-heading">Create Research Note</DialogTitle>
                  <DialogDescription className="financial-body">
                    Add your analysis, observations, or research findings. Notes are timestamped and immutable.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <RichTextEditor 
                    onSubmit={handleSubmit} 
                    isSubmitting={isSubmitting}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}