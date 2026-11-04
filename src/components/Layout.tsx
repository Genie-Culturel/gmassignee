import { Outlet, Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, PlayCircle, BookOpen, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isMockMode } from '@/lib/supabase';
import { setDemoFlag } from '@/lib/config';

export function Layout() {
  const location = useLocation();
  const currentPath = location.pathname.split('/')[1] || 'dashboard';
  const { displayName, isAdmin, signOut } = useAuth();

  const toggleDemo = () => {
    setDemoFlag(!isMockMode);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4 gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">GMassignee</h1>
            <p className="text-xs text-muted-foreground truncate">
              {isMockMode ? 'Mode démo' : displayName}
              {isAdmin && !isMockMode ? ' · admin' : ''}
            </p>
          </div>
          {!isMockMode && (
            <Button variant="ghost" size="sm" onClick={() => signOut()} aria-label="Se déconnecter">
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      <div className="container px-4 py-6">
        <Tabs value={currentPath} className="mb-6">
          <TabsList className="relative flex w-full items-center justify-center gap-1">
            <div className="flex items-center gap-1">
              <TabsTrigger value="dashboard" asChild>
                <Link to="/dashboard" className="flex items-center gap-2" aria-label="Historique des sessions">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Historique des sessions</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="suivi-parties" asChild>
                <Link to="/suivi-parties" className="flex items-center gap-2" aria-label="Suivi parties">
                  <PlayCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Suivi parties</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="formation" asChild>
                <Link to="/formation" className="flex items-center gap-2" aria-label="Formations et procédures">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Formations et procédures</span>
                </Link>
              </TabsTrigger>
            </div>
            <a 
              href="https://gmassignee.lovable.app/" 
              target="_self"
              className="absolute right-1 flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Retour Dashboard GM"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Retour Dashboard GM</span>
            </a>
          </TabsList>
        </Tabs>

        <main>
          <Outlet />
        </main>
      </div>

      <footer className="border-t mt-12 py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground space-y-2">
          <p>Génie Culturel © {new Date().getFullYear()}</p>
          <button type="button" className="underline text-xs" onClick={toggleDemo}>
            {isMockMode ? 'Quitter le mode démo' : 'Passer en mode démo'}
          </button>
        </div>
      </footer>
    </div>
  );
}
