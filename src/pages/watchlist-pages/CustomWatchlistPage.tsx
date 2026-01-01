import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Watchlist, watchlistsApi } from '@/lib/watchlist-api';
import { format } from 'date-fns';
import { FolderOpen, MoreVertical, Pen, RefreshCw, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CustomWatchlistPage = () => {
  const navigate = useNavigate();

  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Watchlist | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Watchlist | null>(null);

  const loadWatchlists = async () => {
    try {
      setLoading(true);
      const data = await watchlistsApi.getAllWatchlists();
      setWatchlists(data);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load watchlists', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlists();
  }, []);

  const filtered = watchlists
    .filter(w => w.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortAsc ? da - db : db - da;
    });

  const confirmDeleteWatchlist = (w: Watchlist) => {
    setDeleteTarget(w);
    setDeleteDialogOpen(true);
  };

  const doDeleteWatchlist = async () => {
    if (!deleteTarget) return;
    try {
      await watchlistsApi.deleteWatchlist(deleteTarget.id);
      toast({ title: 'Deleted', description: 'Watchlist deleted' });
      setWatchlists(prev => prev.filter(w => w.id !== deleteTarget.id));
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to delete watchlist', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const openRenameDialog = (w: Watchlist) => {
    setRenameTarget(w);
    setRenameValue(w.name);
    setRenameDialogOpen(true);
  };

  const doRenameWatchlist = async () => {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name) {
      toast({ title: 'Validation', description: 'Please enter a name', variant: 'destructive' });
      return;
    }
    try {
      const updated = await watchlistsApi.renameWatchlist(renameTarget.id, name);
      setWatchlists(prev => prev.map(w => (w.id === renameTarget.id ? updated : w)));
      toast({ title: 'Renamed', description: 'Watchlist renamed' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to rename watchlist', variant: 'destructive' });
    } finally {
      setRenameDialogOpen(false);
      setRenameTarget(null);
      setRenameValue('');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'd MMM yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <main className="w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header */}
        <Card className="shadow-card border-0 mb-6 animate-fade-in">
          <CardHeader>
            <CardTitle className="financial-heading text-2xl flex items-center">
              <FolderOpen className="h-6 w-6 mr-3 text-accent" />
              Custom Watchlists
            </CardTitle>
            <CardDescription className="financial-body">
              Manage and organize your custom watchlists
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Toolbar */}
        <Card className="shadow-card border-0 mb-4">
          <CardContent className="pt-6">
            <div className="flex gap-3 items-center">
              <Input
                className="flex-1 max-w-md"
                placeholder="Search watchlists..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => setSortAsc(s => !s)}
                className="gap-2"
              >
                Sort: {sortAsc ? 'Oldest First' : 'Newest First'}
              </Button>
              <Button
                variant="outline"
                onClick={loadWatchlists}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {loading ? (
          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : filtered.length > 0 ? (
          <Card className="shadow-card border-0">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Name</TableHead>
                    <TableHead className="w-[25%]">Created At</TableHead>
                    <TableHead className="w-[25%]">Updated At</TableHead>
                    <TableHead className="w-[10%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((watchlist) => (
                    <TableRow key={watchlist.id}>
                      <TableCell>
                        <button
                          onClick={() => navigate(`/custom-watchlists/${watchlist.id}`)}
                          className="font-medium hover:text-accent hover:underline text-left capitalize"
                        >
                          {watchlist.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(watchlist.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(watchlist.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openRenameDialog(watchlist)}
                              className="gap-2"
                            >
                              <Pen className="h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => confirmDeleteWatchlist(watchlist)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="financial-subheading mb-2">No Watchlists Found</h3>
            <p className="financial-body">
              {search ? 'Try adjusting your search' : 'Create your first watchlist to get started'}
            </p>
          </div>
        )}

        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Watchlist</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the watchlist "{deleteTarget?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={doDeleteWatchlist}>Yes, delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Rename dialog */}
        <AlertDialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rename Watchlist</AlertDialogTitle>
              <AlertDialogDescription>
                Enter a new name for "{renameTarget?.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="pb-4">
              <Input
                className="w-full px-3 py-2 border rounded-md"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Watchlist name"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={doRenameWatchlist}>Save</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default CustomWatchlistPage;
