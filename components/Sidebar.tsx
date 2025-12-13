'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  FolderOpen,
  Plus,
  Sparkles,
  ChevronRight,
  Loader2,
  X,
  LogOut,
  User,
  MoreHorizontal
} from 'lucide-react';
import { useSession, signOut } from '@/lib/auth-client';

interface SidebarProps {
  currentProjectId?: number;
}

export function Sidebar({ currentProjectId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
    migrateOrphanedProjects();
  }, []);

  const migrateOrphanedProjects = async () => {
    try {
      const response = await fetch('/api/migrate');
      const data = await response.json();
      if (data.success && data.data.orphanedCount > 0) {
        await fetch('/api/migrate', { method: 'POST' });
        fetchProjects();
      }
    } catch (error) {
      console.error('Error checking for orphaned projects:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName.trim() })
      });
      const data = await response.json();
      if (data.success) {
        setNewProjectName('');
        setShowCreateModal(false);
        fetchProjects();
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setCreating(false);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[var(--color-border-default)] bg-[var(--color-canvas-subtle)]">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-14 items-center justify-between px-4 border-b border-[var(--color-border-muted)]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-accent-emphasis)] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-[var(--color-fg-default)]">AIO Analysis</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {/* Main Nav */}
            <div className="space-y-1">
              <Link
                href="/"
                className={`gh-nav-item ${isActive('/') ? 'active' : ''}`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Home
              </Link>
            </div>

            {/* Projects Section */}
            <div className="mt-6">
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
                  Projects
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--color-fg-muted)]" />
                </div>
              ) : projects.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <div className="mx-auto w-10 h-10 rounded-md bg-[var(--color-neutral-muted)] flex items-center justify-center mb-3">
                    <FolderOpen className="h-5 w-5 text-[var(--color-fg-muted)]" />
                  </div>
                  <p className="text-sm text-[var(--color-fg-muted)] mb-2">No projects yet</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-[var(--color-accent-fg)]"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Create your first project
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {projects.map((project) => {
                    const isProjectActive = currentProjectId === project.id;
                    return (
                      <Link
                        key={project.id}
                        href={`/project/${project.id}`}
                        className={`gh-nav-item group ${isProjectActive ? 'active' : ''}`}
                      >
                        <div className={`flex h-6 w-6 items-center justify-center rounded text-xs font-medium ${
                          isProjectActive
                            ? 'bg-[var(--color-accent-emphasis)] text-white'
                            : 'bg-[var(--color-neutral-muted)] text-[var(--color-fg-muted)]'
                        }`}>
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="flex-1 truncate text-sm">{project.name}</span>
                        <ChevronRight className={`h-4 w-4 text-[var(--color-fg-subtle)] transition-opacity ${
                          isProjectActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`} />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* User Section */}
          {session?.user && (
            <div className="border-t border-[var(--color-border-muted)] p-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-3 rounded-md px-3 py-2 hover:bg-[var(--color-neutral-muted)] transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-emphasis)] text-white text-sm font-medium">
                      {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-[var(--color-fg-default)] truncate">
                        {session.user.name || 'User'}
                      </p>
                      <p className="text-xs text-[var(--color-fg-muted)] truncate">
                        {session.user.email}
                      </p>
                    </div>
                    <MoreHorizontal className="h-4 w-4 text-[var(--color-fg-muted)]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    <span className="truncate">{session.user.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </aside>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-[var(--color-canvas-default)] rounded-md border border-[var(--color-border-default)] shadow-[var(--color-shadow-large)] p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-fg-default)]">Create Project</h3>
                <p className="text-sm text-[var(--color-fg-muted)] mt-1">Start tracking a new set of keywords</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-[var(--color-fg-muted)]"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Enter project name..."
              onKeyDown={(e) => e.key === 'Enter' && createProject()}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={createProject}
                disabled={creating || !newProjectName.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
