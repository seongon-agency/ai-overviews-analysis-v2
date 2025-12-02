'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  FolderOpen,
  Plus,
  Search,
  Settings,
  ChevronRight,
  Loader2,
  X
} from 'lucide-react';

interface SidebarProps {
  currentProjectId?: number;
}

export function Sidebar({ currentProjectId }: SidebarProps) {
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

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
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-gray-50/40">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">AIO Analysis</h1>
              <p className="text-xs text-muted-foreground">Google AI Overviews</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            {/* Main Nav */}
            <div className="space-y-1">
              <Link
                href="/"
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Home
              </Link>
            </div>

            <Separator className="my-6" />

            {/* Projects Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Projects
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : projects.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-muted-foreground">No projects yet</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1 h-auto p-0 text-xs"
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
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          isProjectActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <FolderOpen className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{project.name}</span>
                        <ChevronRight className={`h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 ${
                          isProjectActive ? 'opacity-100' : ''
                        }`} />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" size="sm">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </aside>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Project</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              onKeyDown={(e) => e.key === 'Enter' && createProject()}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={createProject}
                disabled={creating || !newProjectName.trim()}
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
