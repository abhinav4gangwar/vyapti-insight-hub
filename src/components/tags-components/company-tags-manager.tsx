import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Tag, tagsApi } from '@/lib/tags-api';
import { Loader2, Pencil, Plus, Tag as TagIcon, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CompanyTagsManagerProps {
  isin: string;
  onTagsUpdate?: (tags: Tag[]) => void;
}

export function CompanyTagsManager({ isin, onTagsUpdate }: CompanyTagsManagerProps) {
  const [open, setOpen] = useState(false);
  const [companyTags, setCompanyTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  
  // Edit tag state
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);
  
  // Delete tag state
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingTag, setIsDeletingTag] = useState(false);

  // Load company tags and all available tags
  const loadTags = async () => {
    try {
      const [companyTagsData, allTagsData] = await Promise.all([
        tagsApi.getCompanyTags(isin),
        tagsApi.getAllTags(),
      ]);
      setCompanyTags(companyTagsData);
      setAllTags(allTagsData);
      onTagsUpdate?.(companyTagsData);
    } catch (error) {
      console.error('Failed to load tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tags',
        variant: 'destructive',
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, [isin]);

  const handleAddTag = async (tag: Tag) => {
    setIsLoading(true);
    try {
      const result = await tagsApi.attachTagsToCompany(isin, [tag.id]);
      
      if (result.already_present > 0) {
        toast({
          title: 'Tag Already Present',
          description: `"${tag.name}" is already added to this company`,
        });
      } else {
        const updatedTags = [...companyTags, tag];
        setCompanyTags(updatedTags);
        onTagsUpdate?.(updatedTags);
        toast({
          title: 'Tag Added',
          description: `"${tag.name}" has been added successfully`,
        });
      }
      setSearchValue('');
    } catch (error) {
      console.error('Failed to add tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to add tag',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: string, tagName: string) => {
    setIsLoading(true);
    try {
      await tagsApi.removeTagsFromCompany(isin, [tagId]);
      const updatedTags = companyTags.filter(t => t.id !== tagId);
      setCompanyTags(updatedTags);
      onTagsUpdate?.(updatedTags);
      toast({
        title: 'Tag Removed',
        description: `"${tagName}" has been removed`,
      });
    } catch (error) {
      console.error('Failed to remove tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove tag',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewTag = async (value?: string) => {
    const nameToCreate = (value ?? searchValue).trim();
    if (!nameToCreate) return;
    
    setIsCreatingTag(true);
    try {
      const newTag = await tagsApi.createTag(nameToCreate);
      setAllTags([...allTags, newTag]);
      await handleAddTag(newTag);
      toast({
        title: 'Tag Created',
        description: `"${newTag.name}" has been created and added`,
      });
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

  const handleEditTagClick = (tag: Tag) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !editTagName.trim()) return;
    
    setIsUpdatingTag(true);
    try {
      const updatedTag = await tagsApi.updateTag(editingTag.id, editTagName.trim());
      
      // Update in allTags
      setAllTags(allTags.map(t => t.id === updatedTag.id ? updatedTag : t));
      
      // Update in companyTags if present
      const updatedCompanyTags = companyTags.map(t => 
        t.id === updatedTag.id ? updatedTag : t
      );
      setCompanyTags(updatedCompanyTags);
      onTagsUpdate?.(updatedCompanyTags);
      
      toast({
        title: 'Tag Updated',
        description: `Tag renamed to "${updatedTag.name}"`,
      });
      
      setIsEditDialogOpen(false);
      setEditingTag(null);
      setEditTagName('');
    } catch (error) {
      console.error('Failed to update tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tag',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingTag(false);
    }
  };

  const handleDeleteTagClick = (tag: Tag) => {
    setDeletingTag(tag);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;
    
    setIsDeletingTag(true);
    try {
      await tagsApi.deleteTag(deletingTag.id);
      
      // Remove from allTags
      setAllTags(allTags.filter(t => t.id !== deletingTag.id));
      
      // Remove from companyTags if present
      const updatedCompanyTags = companyTags.filter(t => t.id !== deletingTag.id);
      setCompanyTags(updatedCompanyTags);
      onTagsUpdate?.(updatedCompanyTags);
      
      toast({
        title: 'Tag Deleted',
        description: `"${deletingTag.name}" has been permanently deleted`,
      });
      
      setIsDeleteDialogOpen(false);
      setDeletingTag(null);
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete tag',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingTag(false);
    }
  };

  const availableTags = allTags.filter(
    tag => !companyTags.some(ct => ct.id === tag.id)
  );

  const filteredTags = searchValue
    ? availableTags.filter(tag =>
        tag.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : availableTags;

  const showCreateOption = searchValue.trim() && 
    !allTags.some(tag => tag.name.toLowerCase() === searchValue.trim().toLowerCase());

  if (isInitialLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading tags...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {companyTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="financial-body gap-1 pr-1 hover:bg-secondary/80 transition-colors"
          >
            <TagIcon className="h-3 w-3" />
           <p className='max-w-[200px] truncate'>{tag.name}</p> 
          </Badge>
        ))}
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="financial-body h-6 gap-1 text-xs"
            >
              <Plus className="h-3 w-3" />
              Add Tags
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="financial-heading">Manage Company Tags</DialogTitle>
              <DialogDescription className="financial-body">
                Add or remove tags for this company. Tags are visible organization-wide.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Current Tags */}
              {companyTags.length > 0 && (
                <div className="space-y-2">
                  <label className="financial-subheading text-sm">Current Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {companyTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="financial-body gap-1 pr-1 max-w-[450px]"
                      >
                        <TagIcon className="h-3 w-3" />
                       <p className='truncate'>{tag.name}</p> 
                        <button
                          onClick={() => handleRemoveTag(tag.id, tag.name)}
                          disabled={isLoading}
                          className="ml-1 hover:bg-muted rounded-sm p-0.5 transition-colors disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Tags */}
              <div className="space-y-2">
                <label className="financial-subheading text-sm">Add Tags</label>
                <Command className="border rounded-lg max-w-[450px]">
                  <CommandInput
                    placeholder="Search or create tag..."
                    value={searchValue}
                    onValueChange={setSearchValue}
                    disabled={isLoading || isCreatingTag}
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
                          
                          className="cursor-pointer"
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
                            disabled={isLoading || isCreatingTag}
                            className="cursor-pointer flex items-center justify-between group"
                          >
                            <div 
                              className="flex items-center flex-1"
                              onClick={() => handleAddTag(tag)}
                            >
                              <TagIcon className="h-4 w-4 mr-2" />
                             <p className='truncate max-w-[350px]'>{tag.name}</p> 
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTagClick(tag);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTagClick(tag);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="financial-heading">Edit Tag</DialogTitle>
            <DialogDescription className="financial-body">
              Update the tag name. This will affect all companies using this tag.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="financial-subheading text-sm">Tag Name</label>
              <Input
                value={editTagName}
                onChange={(e) => setEditTagName(e.target.value)}
                placeholder="Enter tag name"
                disabled={isUpdatingTag}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isUpdatingTag) {
                    handleUpdateTag();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingTag(null);
                setEditTagName('');
              }}
              disabled={isUpdatingTag}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTag}
              disabled={isUpdatingTag || !editTagName.trim()}
            >
              {isUpdatingTag && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Tag
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Tag Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this tag?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tag from all companies. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingTag(null);
              }}
              disabled={isDeletingTag}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTag}
              disabled={isDeletingTag}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingTag && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}