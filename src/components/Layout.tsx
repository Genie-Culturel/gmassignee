import { Outlet, Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, PlayCircle, BookOpen } from 'lucide-react';

export function Layout() {
  const location = useLocation();
  const currentPath = location.pathname.split('/')[1] || 'dashboard';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold">GMassignee</h1>
            <p className="text-xs text-muted-foreground">VR Center Procedures</p>
          </div>
        </div>
      </header>

      <div className="container px-4 py-6">
        <Tabs value={currentPath} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" asChild>
              <Link to="/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="suivi-parties" asChild>
              <Link to="/suivi-parties" className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Suivi parties</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="formation" asChild>
              <Link to="/formation" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Formation</span>
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <main>
          <Outlet />
        </main>
      </div>

      <footer className="border-t mt-12 py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>Génie Culturel © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
