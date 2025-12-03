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
    <div className="min-h-screen bg-gray-50/30">
      <Sidebar />

      {/* Main Content */}
      <main className="pl-64">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            </div>
            <p className="text-gray-500 ml-13">
              Track and analyze Google AI Overview citations for your brand
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Projects</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{projects.length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Brand Tracking</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {projects.filter(p => p.brand_domain).length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Recent Activity</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {projects.length > 0 ? 'Active' : '—'}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Your Projects</h2>
              <span className="text-sm text-gray-400">{projects.length} total</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                  <p className="text-sm text-gray-500 mt-3">Loading your projects...</p>
                </div>
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                    <FolderOpen className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No projects yet</h3>
                  <p className="text-gray-500 text-sm mb-6 text-center max-w-sm">
                    Create your first project to start analyzing Google AI Overviews and track your brand citations.
                  </p>
                  <p className="text-sm text-gray-400">
                    Click the <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-100 rounded text-gray-600 font-medium text-xs mx-1">+</span> button in the sidebar to get started
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
                    <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-gray-200 hover:-translate-y-0.5">
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-sm font-bold text-gray-600 group-hover:from-indigo-100 group-hover:to-indigo-50 group-hover:text-indigo-600 transition-colors">
                              {project.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {project.name}
                              </h3>
                              {project.brand_domain ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Globe className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{project.brand_domain}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-amber-600">No brand configured</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => deleteProject(project.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(project.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-indigo-600 transition-colors">
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
