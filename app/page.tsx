'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Project } from '@/lib/types';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { FolderOpen, Calendar, Globe, Trash2, ArrowRight, Loader2, Sparkles, TrendingUp } from 'lucide-react';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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

  const deleteProject = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-canvas-default)]">
      <Sidebar />

      {/* Main Content */}
      <main className="pl-64">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-accent-emphasis)] text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-semibold text-[var(--color-fg-default)]">Welcome back</h1>
            </div>
            <p className="text-sm text-[var(--color-fg-muted)] ml-13">
              Track and analyze Google AI Overview citations for your brand
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="gh-box p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[var(--color-fg-muted)]">Total Projects</p>
                  <p className="text-2xl font-semibold text-[var(--color-fg-default)] mt-1">{projects.length}</p>
                </div>
                <div className="h-10 w-10 rounded-md bg-[var(--color-accent-subtle)] flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-[var(--color-accent-fg)]" />
                </div>
              </div>
            </div>
            <div className="gh-box p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[var(--color-fg-muted)]">Brand Tracking</p>
                  <p className="text-2xl font-semibold text-[var(--color-fg-default)] mt-1">
                    {projects.filter(p => p.brand_domain).length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-md bg-[var(--color-success-subtle)] flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-[var(--color-success-fg)]" />
                </div>
              </div>
            </div>
            <div className="gh-box p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[var(--color-fg-muted)]">Recent Activity</p>
                  <p className="text-2xl font-semibold text-[var(--color-fg-default)] mt-1">
                    {projects.length > 0 ? 'Active' : '—'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-md bg-[var(--color-warning-subtle)] flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-[var(--color-warning-fg)]" />
                </div>
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">Your Projects</h2>
              <span className="gh-counter">{projects.length}</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--color-accent-fg)]" />
                  <p className="text-sm text-[var(--color-fg-muted)] mt-3">Loading your projects...</p>
                </div>
              </div>
            ) : projects.length === 0 ? (
              <div className="gh-box">
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="h-14 w-14 rounded-md bg-[var(--color-neutral-muted)] flex items-center justify-center mb-4">
                    <FolderOpen className="w-7 h-7 text-[var(--color-fg-muted)]" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--color-fg-default)] mb-1">No projects yet</h3>
                  <p className="text-[var(--color-fg-muted)] text-sm mb-4 text-center max-w-sm">
                    Create your first project to start analyzing Google AI Overviews and track your brand citations.
                  </p>
                  <p className="text-sm text-[var(--color-fg-subtle)]">
                    Click the <span className="inline-flex items-center justify-center w-5 h-5 bg-[var(--color-neutral-muted)] rounded text-[var(--color-fg-default)] font-medium text-xs mx-1">+</span> button in the sidebar to get started
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project, index) => (
                  <Link
                    key={project.id}
                    href={`/project/${project.id}`}
                    className="group block animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="h-full gh-box overflow-hidden transition-all duration-200 hover:border-[var(--color-accent-emphasis)] card-hover">
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-md bg-[var(--color-neutral-muted)] flex items-center justify-center text-sm font-semibold text-[var(--color-fg-muted)] group-hover:bg-[var(--color-accent-subtle)] group-hover:text-[var(--color-accent-fg)] transition-colors">
                              {project.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-medium text-sm text-[var(--color-fg-default)] group-hover:text-[var(--color-accent-fg)] transition-colors">
                                {project.name}
                              </h3>
                              {project.brand_domain ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Globe className="h-3 w-3 text-[var(--color-fg-subtle)]" />
                                  <span className="text-xs text-[var(--color-fg-muted)]">{project.brand_domain}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-[var(--color-warning-fg)]">No brand configured</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-fg-muted)] hover:text-[var(--color-danger-fg)] hover:bg-[var(--color-danger-subtle)]"
                            onClick={(e) => deleteProject(project.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-muted)]">
                          <div className="flex items-center gap-1.5 text-xs text-[var(--color-fg-subtle)]">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(project.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center gap-1 text-xs font-medium text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent-fg)] transition-colors">
                            <span>Open</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
