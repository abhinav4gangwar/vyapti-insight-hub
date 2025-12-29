import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  FolderPlus,
  Sparkles,
  History,
} from 'lucide-react';
import {
  getGroupsWithQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  moveQuestion,
  renameGroup,
  deleteGroup,
  toggleQuestionActiveStatus,
} from '@/lib/prompt-triggers-api';
import { QuestionHistoryDialog } from '@/components/QuestionHistoryDialog';
import type {
  GroupWithQuestions,
  PromptTriggerQuestion,
  SourceShorthand,
  CreateQuestionParams,
} from '@/types/prompt-triggers';

const SOURCE_LABELS: Record<SourceShorthand, string> = {
  A: 'All',
  K: 'Expert Call',
  E: 'Earnings Call',
};

export default function PromptTriggerQuestions() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupWithQuestions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Dialog states
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [isEditQuestionOpen, setIsEditQuestionOpen] = useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isRenameGroupOpen, setIsRenameGroupOpen] = useState(false);
  const [isMoveQuestionOpen, setIsMoveQuestionOpen] = useState(false);
  const [isDeleteQuestionOpen, setIsDeleteQuestionOpen] = useState(false);
  const [isDeleteGroupOpen, setIsDeleteGroupOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyQuestionId, setHistoryQuestionId] = useState<number | null>(null);
  const [historyQuestionText, setHistoryQuestionText] = useState('');

  // Form states
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedQuestion, setSelectedQuestion] = useState<{
    id: number;
    question_text: string;
    group_name: string;
    source_shorthand: SourceShorthand;
  } | null>(null);

  const [newQuestionText, setNewQuestionText] = useState('');
  const [newSourceShorthand, setNewSourceShorthand] = useState<SourceShorthand>('A');
  const [newGroupName, setNewGroupName] = useState('');
  const [renameGroupNewName, setRenameGroupNewName] = useState('');
  const [moveToGroup, setMoveToGroup] = useState('');

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const data = await getGroupsWithQuestions();
      setGroups(data);
      // Expand all groups by default
      setExpandedGroups(new Set(data.map((g) => g.name)));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load questions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  // Add Question to existing group
  const handleAddQuestion = async () => {
    if (!newQuestionText.trim() || !selectedGroup) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createQuestion({
        question_text: newQuestionText.trim(),
        group_name: selectedGroup,
        source_shorthand: newSourceShorthand,
      });
      toast({ title: 'Success', description: 'Question added successfully' });
      setIsAddQuestionOpen(false);
      resetForm();
      fetchGroups();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add question',
        variant: 'destructive',
      });
    }
  };

  // Edit Question
  const handleEditQuestion = async () => {
    if (!selectedQuestion || !newQuestionText.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateQuestion(selectedQuestion.id, {
        question_text: newQuestionText.trim(),
        source_shorthand: newSourceShorthand,
      });
      toast({ title: 'Success', description: 'Question updated successfully' });
      setIsEditQuestionOpen(false);
      resetForm();
      fetchGroups();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update question',
        variant: 'destructive',
      });
    }
  };

  // Delete Question
  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return;

    try {
      await deleteQuestion(selectedQuestion.id);
      toast({ title: 'Success', description: 'Question deleted successfully' });
      setIsDeleteQuestionOpen(false);
      setSelectedQuestion(null);
      fetchGroups();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete question',
        variant: 'destructive',
      });
    }
  };

  // Move Question
  const handleMoveQuestion = async () => {
    if (!selectedQuestion || !moveToGroup) return;

    try {
      await moveQuestion(selectedQuestion.id, { new_group_name: moveToGroup });
      toast({ title: 'Success', description: 'Question moved successfully' });
      setIsMoveQuestionOpen(false);
      setSelectedQuestion(null);
      setMoveToGroup('');
      fetchGroups();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move question',
        variant: 'destructive',
      });
    }
  };

  // Add new Group
  const handleAddGroup = async () => {
    if (!newGroupName.trim() || !newQuestionText.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createQuestion({
        question_text: newQuestionText.trim(),
        group_name: newGroupName.trim(),
        source_shorthand: newSourceShorthand,
      });
      toast({ title: 'Success', description: 'Group created successfully' });
      setIsAddGroupOpen(false);
      resetForm();
      fetchGroups();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create group',
        variant: 'destructive',
      });
    }
  };

  // Rename Group
  const handleRenameGroup = async () => {
    if (!selectedGroup || !renameGroupNewName.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await renameGroup({
        old_name: selectedGroup,
        new_name: renameGroupNewName.trim(),
      });
      toast({ title: 'Success', description: 'Group renamed successfully' });
      setIsRenameGroupOpen(false);
      setSelectedGroup('');
      setRenameGroupNewName('');
      fetchGroups();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rename group',
        variant: 'destructive',
      });
    }
  };

  // Delete Group
  const handleDeleteGroup = async (deleteQuestions: boolean) => {
    if (!selectedGroup) return;

    try {
      await deleteGroup(selectedGroup, deleteQuestions);
      toast({ title: 'Success', description: 'Group deleted successfully' });
      setIsDeleteGroupOpen(false);
      setSelectedGroup('');
      fetchGroups();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete group',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setNewQuestionText('');
    setNewSourceShorthand('A');
    setNewGroupName('');
    setSelectedQuestion(null);
    setSelectedGroup('');
  };

  const openAddQuestion = (groupName: string) => {
    setSelectedGroup(groupName);
    setNewQuestionText('');
    setNewSourceShorthand('A');
    setIsAddQuestionOpen(true);
  };

  const openEditQuestion = (question: GroupWithQuestions['questions'][0], groupName: string) => {
    setSelectedQuestion({
      id: question.id,
      question_text: question.question_text,
      group_name: groupName,
      source_shorthand: question.source_shorthand,
    });
    setNewQuestionText(question.question_text);
    setNewSourceShorthand(question.source_shorthand);
    setIsEditQuestionOpen(true);
  };

  const openDeleteQuestion = (question: GroupWithQuestions['questions'][0], groupName: string) => {
    setSelectedQuestion({
      id: question.id,
      question_text: question.question_text,
      group_name: groupName,
      source_shorthand: question.source_shorthand,
    });
    setIsDeleteQuestionOpen(true);
  };

  const openMoveQuestion = (question: GroupWithQuestions['questions'][0], groupName: string) => {
    setSelectedQuestion({
      id: question.id,
      question_text: question.question_text,
      group_name: groupName,
      source_shorthand: question.source_shorthand,
    });
    setMoveToGroup('');
    setIsMoveQuestionOpen(true);
  };

  const openRenameGroup = (groupName: string) => {
    setSelectedGroup(groupName);
    setRenameGroupNewName(groupName);
    setIsRenameGroupOpen(true);
  };

  const openDeleteGroup = (groupName: string) => {
    setSelectedGroup(groupName);
    setIsDeleteGroupOpen(true);
  };

  const openQuestionHistory = (question: GroupWithQuestions['questions'][0]) => {
    setHistoryQuestionId(question.id);
    setHistoryQuestionText(question.question_text);
    setIsHistoryOpen(true);
  };

  const handleToggleActive = async (question: GroupWithQuestions['questions'][0]) => {
    const newStatus = !question.is_active;
    const action = newStatus ? 'activated' : 'deactivated';
    const actionVerb = newStatus ? 'Activate' : 'Deactivate';

    try {
      await toggleQuestionActiveStatus(question.id, {
        is_active: newStatus,
        reason: `Manual ${actionVerb.toLowerCase()} from UI`,
      });

      toast({
        title: newStatus ? '✓ Question Activated' : '○ Question Deactivated',
        description: newStatus
          ? `"${question.question_text.substring(0, 50)}${question.question_text.length > 50 ? '...' : ''}" is now active and will be used.`
          : `"${question.question_text.substring(0, 50)}${question.question_text.length > 50 ? '...' : ''}" is now inactive and will be skipped.`,
        variant: newStatus ? 'default' : 'destructive',
      });

      fetchGroups();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${actionVerb.toLowerCase()} question`,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/settings')} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="financial-heading text-3xl mb-2 flex items-center">
              <Sparkles className="h-8 w-8 mr-3 text-accent" />
              Prompt Trigger Questions
            </h1>
            <p className="financial-body">
              Manage questions and groups used for AI document analysis
            </p>
          </div>
          <Button onClick={() => setIsAddGroupOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Add New Group
          </Button>
        </div>

        {/* Groups List */}
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.name} className="shadow-card border-0">
              <Collapsible open={expandedGroups.has(group.name)}>
                <CollapsibleTrigger asChild>
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleGroup(group.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedGroups.has(group.name) ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <CardTitle className="financial-heading text-lg">{group.name}</CardTitle>
                        <Badge variant="outline">{group.question_count} questions</Badge>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAddQuestion(group.name)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Question
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRenameGroup(group.name)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteGroup(group.name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-3">
                      {group.questions.map((question) => (
                        <div
                          key={question.id}
                          className="flex items-start justify-between p-3 bg-secondary/30 rounded-lg"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm">{question.question_text}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {SOURCE_LABELS[question.source_shorthand]}
                              </Badge>
                              <Badge
                                variant={question.is_active ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {question.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">v{question.version}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openQuestionHistory(question)}
                              title="View History"
                            >
                              <History className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(question)}
                              title={question.is_active ? 'Deactivate' : 'Activate'}
                            >
                              <span className="text-xs">{question.is_active ? 'Deactivate' : 'Activate'}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditQuestion(question, group.name)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openMoveQuestion(question, group.name)}
                            >
                              <span className="text-xs">Move</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteQuestion(question, group.name)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {group.questions.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No questions in this group
                        </p>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}

          {groups.length === 0 && (
            <div className="text-center py-16">
              <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="financial-subheading mb-2">No Groups Found</h3>
              <p className="financial-body mb-4">
                Create your first group to start adding questions
              </p>
              <Button onClick={() => setIsAddGroupOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Add New Group
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Add Question Dialog */}
      <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Question to "{selectedGroup}"</DialogTitle>
            <DialogDescription>Add a new question to this group</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question Text</Label>
              <Input
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Enter the question..."
              />
            </div>
            <div className="space-y-2">
              <Label>Source Type</Label>
              <Select
                value={newSourceShorthand}
                onValueChange={(v) => setNewSourceShorthand(v as SourceShorthand)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">All</SelectItem>
                  <SelectItem value="K">Expert Call</SelectItem>
                  <SelectItem value="E">Earnings Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddQuestionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddQuestion}>Add Question</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={isEditQuestionOpen} onOpenChange={setIsEditQuestionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>Update the question details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question Text</Label>
              <Input
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Enter the question..."
              />
            </div>
            <div className="space-y-2">
              <Label>Source Type</Label>
              <Select
                value={newSourceShorthand}
                onValueChange={(v) => setNewSourceShorthand(v as SourceShorthand)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">All</SelectItem>
                  <SelectItem value="K">Expert Call</SelectItem>
                  <SelectItem value="E">Earnings Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditQuestionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditQuestion}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Group Dialog */}
      <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new group with its first question
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name..."
              />
            </div>
            <div className="space-y-2">
              <Label>First Question</Label>
              <Input
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Enter the first question..."
              />
            </div>
            <div className="space-y-2">
              <Label>Source Type</Label>
              <Select
                value={newSourceShorthand}
                onValueChange={(v) => setNewSourceShorthand(v as SourceShorthand)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">All</SelectItem>
                  <SelectItem value="K">Expert Call</SelectItem>
                  <SelectItem value="E">Earnings Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddGroupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGroup}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Group Dialog */}
      <Dialog open={isRenameGroupOpen} onOpenChange={setIsRenameGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Group</DialogTitle>
            <DialogDescription>Enter a new name for "{selectedGroup}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Group Name</Label>
              <Input
                value={renameGroupNewName}
                onChange={(e) => setRenameGroupNewName(e.target.value)}
                placeholder="Enter new group name..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameGroupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameGroup}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Question Dialog */}
      <Dialog open={isMoveQuestionOpen} onOpenChange={setIsMoveQuestionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Question</DialogTitle>
            <DialogDescription>Select a group to move this question to</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Group</Label>
              <Select value={moveToGroup} onValueChange={setMoveToGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group..." />
                </SelectTrigger>
                <SelectContent>
                  {groups
                    .filter((g) => g.name !== selectedQuestion?.group_name)
                    .map((group) => (
                      <SelectItem key={group.name} value={group.name}>
                        {group.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveQuestionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMoveQuestion} disabled={!moveToGroup}>
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Question Alert */}
      <AlertDialog open={isDeleteQuestionOpen} onOpenChange={setIsDeleteQuestionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuestion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Group Alert */}
      <AlertDialog open={isDeleteGroupOpen} onOpenChange={setIsDeleteGroupOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group "{selectedGroup}"</AlertDialogTitle>
            <AlertDialogDescription>
              What would you like to do with the questions in this group?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteGroup(true)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Group & Questions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Question History Dialog */}
      <QuestionHistoryDialog
        questionId={historyQuestionId}
        questionText={historyQuestionText}
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        onRestored={fetchGroups}
      />
    </div>
  );
}
