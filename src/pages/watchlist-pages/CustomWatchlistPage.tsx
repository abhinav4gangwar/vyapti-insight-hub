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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Watchlist, watchlistsApi } from '@/lib/watchlist-api';
import { ArrowDownUp, Pen, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';

const CustomWatchlistPage = () => {
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

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Custom Watchlists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2 items-center">
            <input
              className="px-3 py-2 border rounded-md flex-1"
              placeholder="Search watchlists"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="outline" onClick={() => setSortAsc(s => !s)}>
             <ArrowDownUp /> Sort by created: {sortAsc ? 'Asc' : 'Desc'}
            </Button>
            <Button onClick={loadWatchlists}>Refresh</Button>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-3">
              {filtered.map(w => (
                <div key={w.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex-1">
                    <a href={`/custom-watchlists/${w.id}`} target="_blank" rel="noreferrer" className="font-medium hover:underline">{w.name}</a>
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(w.created_at).toLocaleString()} • Updated: {new Date(w.updated_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button onClick={() => openRenameDialog(w)}><Pen /></Button>
                    <Button variant="destructive" onClick={() => confirmDeleteWatchlist(w)}><Trash /></Button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && <div className="text-sm text-muted-foreground">No watchlists found</div>}
            </div>
          )}
        </CardContent>
      </Card>

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
          <div className=" pb-4">
            <Input className="w-full px-3 py-2 border rounded-md" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doRenameWatchlist}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomWatchlistPage;
