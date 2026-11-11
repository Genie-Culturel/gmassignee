import { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, PlayCircle, BookOpen, ExternalLink, Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGmOptions } from '@/hooks/useGmOptions';
import { isMockMode } from '@/lib/supabase';
import { setDemoFlag } from '@/lib/config';
import { isFormationEditorPath } from '@/lib/formationNav';
import {
  appLocationChanged,
  appNavTo,
  appSectionFromPathname,
  resolveAppLocation,
} from '@/lib/appNav';

const TAB_GRID: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
};

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = appSectionFromPathname(location.pathname);
  const editorTab = isFormationEditorPath(location.pathname, location.search);
  const tabValue = editorTab ? 'formation-editeur' : currentPath;
  const { user, displayName, isAdmin, isFormateur, switchAccount } = useAuth();
  const { showSuiviParties, showFormations, loading: optionsLoading } = useGmOptions();
  const showEditeur = showFormations && isFormateur;

  useEffect(() => {
    if (optionsLoading) return;
    const next = resolveAppLocation(location.pathname, location.search, {
      showSuiviParties,
      showFormations,
    });
    if (appLocationChanged(location.pathname, location.search, next)) {
      navigate(next, { replace: true });
    }
  }, [
    optionsLoading,
    location.pathname,
    location.search,
    showSuiviParties,
    showFormations,
    navigate,
  ]);

  const onNavTab = (value: string) => {
    if (value === 'formation-editeur') {
      navigate(appNavTo('formation', { editor: true }));
      return;
    }
    if (value === 'dashboard' || value === 'suivi-parties' || value === 'formation') {
      navigate(appNavTo(value));
    }
  };
  const accountEmail = user?.email || '';
  const roleLabel = isAdmin ? 'admin' : isFormateur ? 'formateur' : '';

  const toggleDemo = () => {
    setDemoFlag(!isMockMode);
    window.location.reload();
  };

  const tabCount =
    2 + (showSuiviParties ? 1 : 0) + (showFormations ? 1 : 0) + (showEditeur ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4 gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">GMassignee</h1>
            <p className="text-xs text-muted-foreground truncate">
              {isMockMode ? (
                'Mode démo'
              ) : (
                <>
                  <span className="font-medium text-foreground">{accountEmail || displayName}</span>
                  {accountEmail && displayName && displayName !== accountEmail
                    ? ` · ${displayName}`
                    : ''}
                  {roleLabel ? ` · ${roleLabel}` : ''}
                </>
              )}
            </p>
          </div>
          {!isMockMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => void switchAccount()}
              aria-label="Se déconnecter"
            >
              Se déconnecter
            </Button>
          )}
        </div>
      </header>

      <div className="container px-4 py-6">
        <Tabs value={tabValue} onValueChange={onNavTab} className="mb-6">
          <TabsList className={`grid w-full ${TAB_GRID[tabCount] || 'grid-cols-4'}`}>
            <TabsTrigger value="dashboard" asChild className="w-full justify-center">
              <Link to={appNavTo('dashboard')} className="flex items-center gap-2" aria-label="Historique des sessions">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Historique des sessions</span>
              </Link>
            </TabsTrigger>
            {showSuiviParties && (
              <TabsTrigger value="suivi-parties" asChild className="w-full justify-center">
                <Link to={appNavTo('suivi-parties')} className="flex items-center gap-2" aria-label="Suivi parties">
                  <PlayCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Suivi parties</span>
                </Link>
              </TabsTrigger>
            )}
            {showFormations && (
              <TabsTrigger value="formation" asChild className="w-full justify-center">
                <Link to={appNavTo('formation')} className="flex items-center gap-2" aria-label="Formations et procédures">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Formations et procédures</span>
                </Link>
              </TabsTrigger>
            )}
            {showEditeur && (
              <TabsTrigger value="formation-editeur" asChild className="w-full justify-center">
                <Link
                  to={appNavTo('formation', { editor: true })}
                  className="flex items-center gap-2"
                  aria-label="Éditeur"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="hidden sm:inline">Éditeur</span>
                </Link>
              </TabsTrigger>
            )}
            <Link
              to="https://gmassignee.lovable.app/"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-muted-foreground hover:bg-muted hover:text-foreground w-full"
              aria-label="Retour Dashboard GM"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Retour Dashboard GM</span>
            </Link>
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
