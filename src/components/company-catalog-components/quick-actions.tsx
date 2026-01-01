import { RichTextEditor } from '@/components/notes-components/text-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';
import { notesApi } from '@/lib/notes-api';
import { Tag, tagsApi } from '@/lib/tags-api';
import { Loader2, Plus, StickyNote, Tag as TagIcon } from 'lucide-react';
import { useState } from 'react';

interface QuickAddTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyIsin: string;
  companyName: string;
  allTags: Tag[];
  currentTags: string[];
  onTagsUpdated: () => void;
}

export function QuickAddTagDialog({
  open,
  onOpenChange,
  companyIsin,
  companyName,
  allTags,
  currentTags,
  onTagsUpdated,
}: QuickAddTagDialogProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [createdTags, setCreatedTags] = useState<Tag[]>([]);

  const mergedTagsById = [...allTags, ...createdTags].reduce<Record<string, Tag>>((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});
  const availableTags = Object.values(mergedTagsById).filter(tag => !currentTags.includes(tag.name));
  
  const filteredTags = searchValue
    ? availableTags.filter(tag =>
        tag.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : availableTags;

  const showCreateOption = searchValue.trim() && 
    !Object.values(mergedTagsById).some(tag => tag.name.toLowerCase() === searchValue.trim().toLowerCase());

  const handleCreateNewTag = async (value?: string) => {
    const nameToCreate = (value ?? searchValue).trim();
    if (!nameToCreate) return;
    
    setIsCreatingTag(true);
    try {
      const newTag = await tagsApi.createTag(nameToCreate);
      
      setSelectedTagIds(prev => [...prev, newTag.id]);
      setCreatedTags(prev => [...prev, newTag]);
      
      toast({
        title: 'Tag Created',
        description: `"${newTag.name}" has been created and added to selection`,
      });
      
      setSearchValue('');
      onTagsUpdated();
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new tag',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedTagIds.length === 0) return;

    setIsSubmitting(true);
    try {
      await tagsApi.attachTagsToCompany(companyIsin, selectedTagIds);
      toast({
        title: 'Tags Added',
        description: `Successfully added ${selectedTagIds.length} tag(s) to ${companyName}`,
      });
      onTagsUpdated();
      onOpenChange(false);
      setSelectedTagIds([]);
      setSearchValue('');
    } catch (error) {
      console.error('Failed to add tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to add tags to company',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Get tag name by ID (for selected tags display)
  const getTagById = (tagId: string) => {
    // check locally created tags first, then parent-provided tags
    const local = createdTags.find(t => t.id === tagId);
    if (local) return local;
    return allTags.find(t => t.id === tagId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Add Tags to {companyName}
          </DialogTitle>
          <DialogDescription>
            Select existing tags or create new ones
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Selected Tags Preview */}
          {selectedTagIds.length > 0 && (
            <div className="space-y-2">
              <label className="financial-subheading text-sm">Selected Tags ({selectedTagIds.length})</label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-secondary/30">
                {selectedTagIds.map((tagId) => {
                  const tag = getTagById(tagId);
                  if (!tag) return null;
                  return (
                    <Badge
                      key={tagId}
                      variant="default"
                      className="cursor-pointer max-w-[450px]"
                      onClick={() => toggleTag(tagId)}
                    >
                      <p className='truncate'>{tag.name}</p> 
                      <Plus className="h-3 w-3 ml-1 rotate-45" />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search and Select Tags */}
          <div className="space-y-2">
            <label className="financial-subheading text-sm">Search or Create Tags</label>
            <Command className="border rounded-lg max-w-[550px]">
              <CommandInput
                placeholder="Search or create tag..."
                value={searchValue}
                onValueChange={setSearchValue}
                disabled={isSubmitting || isCreatingTag}
              />
              <CommandList>
                <CommandEmpty>
                  {isCreatingTag ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">Creating tag...</span>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-sm">No tags found</div>
                  )}
                </CommandEmpty>
                
                {showCreateOption && !isCreatingTag && (
                  <CommandGroup>
                    <CommandItem
                      value={searchValue}
                      onSelect={(value) => handleCreateNewTag(value)}
                      className="cursor-pointer bg-accent/50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create new tag "{searchValue}"
                    </CommandItem>
                  </CommandGroup>
                )}
                
                {filteredTags.length > 0 && (
                  <CommandGroup heading="Available Tags">
                    {filteredTags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        onSelect={() => toggleTag(tag.id)}
                        disabled={isSubmitting || isCreatingTag}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center flex-1">
                          <TagIcon className="h-4 w-4 mr-2" />
                         <p className='truncate max-w-[400px]'>{tag.name}</p> 
                        </div>
                        {selectedTagIds.includes(tag.id) && (
                          <Badge variant="secondary" className="ml-2">
                            Selected
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
                setSelectedTagIds([]);
                setSearchValue('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedTagIds.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add ${selectedTagIds.length} Tag(s)`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface QuickAddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyIsin: string;
  companyName: string;
  onNoteAdded: () => void;
}

export function QuickAddNoteDialog({
  open,
  onOpenChange,
  companyIsin,
  companyName,
  onNoteAdded,
}: QuickAddNoteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = authService.getUser();

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
      await notesApi.createNote(companyIsin, {
        content,
        user_id: String(user.id),
        username: user.username,
      });
      toast({
        title: 'Note Created',
        description: `Successfully added note to ${companyName}`,
      });
      onNoteAdded();
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Add Note to {companyName}
          </DialogTitle>
          <DialogDescription>
            Add your analysis, observations, or research findings
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <RichTextEditor onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      </DialogContent>
    </Dialog>
  );
}