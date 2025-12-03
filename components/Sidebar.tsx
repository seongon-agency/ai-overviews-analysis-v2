'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-100 bg-white">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">AIO Analysis</h1>
              <p className="text-xs text-gray-400">AI Overview Tracker</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {/* Main Nav */}
            <div className="space-y-1">
              <Link
                href="/"
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive('/')
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Home
              </Link>
            </div>

            {/* Projects Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between px-3 mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Projects
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                </div>
              ) : projects.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <div className="mx-auto w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                    <FolderOpen className="h-5 w-5 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 mb-2">No projects yet</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
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
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                          isProjectActive
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold ${
                          isProjectActive
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                        }`}>
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="flex-1 truncate">{project.name}</span>
                        <ChevronRight className={`h-4 w-4 text-gray-300 transition-all ${
                          isProjectActive ? 'opacity-100 text-indigo-400' : 'opacity-0 group-hover:opacity-100'
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
            <div className="border-t border-gray-100 p-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white text-sm font-medium">
                      {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session.user.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {session.user.email}
                      </p>
                    </div>
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuItem disabled className="text-gray-500">
                    <User className="mr-2 h-4 w-4" />
                    <span className="truncate">{session.user.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Project</h3>
                <p className="text-sm text-gray-500 mt-0.5">Start tracking a new set of keywords</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Enter project name..."
              className="h-11 rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
              onKeyDown={(e) => e.key === 'Enter' && createProject()}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl text-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={createProject}
                disabled={creating || !newProjectName.trim()}
                className="rounded-xl bg-gray-900 hover:bg-gray-800"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
