'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Project, KeywordRecord, CheckSessionWithStats, AnalysisResult } from '@/lib/types';
import { Sidebar } from '@/components/Sidebar';
import { KeywordsTable } from '@/components/KeywordsTable';
import { SessionComparison } from '@/components/sessions/SessionComparison';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { CompetitorTable } from '@/components/dashboard/CompetitorTable';
import { CompetitorChart } from '@/components/dashboard/CompetitorChart';
import { MetricsTrends } from '@/components/dashboard/MetricsTrends';
import { InsightsPanel } from '@/components/dashboard/InsightsPanel';
import { KeywordPerformanceGrid } from '@/components/dashboard/KeywordPerformanceGrid';
import { RankDistributionChart } from '@/components/dashboard/RankDistributionChart';
import { OrganicRankDistributionChart } from '@/components/dashboard/OrganicRankDistributionChart';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

// Icons
import {
  Clock, Trash2, RefreshCw, Download, Upload, Search,
  BarChart3, AlertTriangle, Loader2, Plus, Settings,
  Eye, TrendingUp, Layers, Globe, ArrowLeft
} from 'lucide-react';

export default function ProjectPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string, 10);

  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<CheckSessionWithStats[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [keywords, setKeywords] = useState<KeywordRecord[]>([]);
  const [previousSession, setPreviousSession] = useState<{ id: number; name: string | null; created_at: string } | null>(null);
  const [rankHistory, setRankHistory] = useState<Map<string, { rank: number | null }[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'keywords' | 'fetch' | 'upload' | 'dashboard' | 'settings'>('keywords');
  const [showPastSession, setShowPastSession] = useState(false);

  // Form states
  const [brandName, setBrandName] = useState('');
  const [brandDomain, setBrandDomain] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [locationCode, setLocationCode] = useState('2704');
  const [languageCode, setLanguageCode] = useState('vi');
  const [fetching, setFetching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Comparison mode
  const [showComparison, setShowComparison] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<number[]>([]);

  // Dashboard state
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [sessionMetrics, setSessionMetrics] = useState<{
    sessionId: number;
    sessionName: string;
    date: string;
    shortDate: string;
    totalKeywords: number;
    withAIO: number;
    aioRate: number;
    brandCitations: number;
    brandCitationRate: number;
    avgBrandRank: number | null;
    topRanked: number;
    // Organic metrics
    organicRankings: number;
    avgOrganicRank: number | null;
    organicVisibilityRate: number;
    topRankedOrganic: number;
  }[]>([]);

  // Fetch project data
  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.data);
        setBrandName(data.data.brand_name || '');
        setBrandDomain(data.data.brand_domain || '');
        setSessions(data.data.sessions || []);

        if (!data.data.sessions || data.data.sessions.length === 0) {
          setActiveView('fetch');
        } else {
          setSelectedSessionId(data.data.sessions[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch session keywords with change data
  const fetchSessionKeywords = useCallback(async (sessionId: number) => {
    try {
      const response = await fetch(
        `/api/sessions/${sessionId}?brandDomain=${encodeURIComponent(brandDomain)}&brandName=${encodeURIComponent(brandName)}&includeChanges=true`
      );
      const data = await response.json();

      if (data.success) {
        setKeywords(data.data.keywords);
        setPreviousSession(data.data.previousSession);
        if (data.data.rankHistory) {
          const histMap = new Map<string, { rank: number | null }[]>();
          Object.entries(data.data.rankHistory).forEach(([keyword, history]) => {
            histMap.set(keyword, history as { rank: number | null }[]);
          });
          setRankHistory(histMap);
        } else {
          setRankHistory(null);
        }
      }
    } catch (error) {
      console.error('Error fetching session keywords:', error);
    }
  }, [brandDomain, brandName]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionKeywords(selectedSessionId);
      // Clear analysis when switching sessions so it re-runs with new session data
      setAnalysis(null);
    }
  }, [selectedSessionId, fetchSessionKeywords]);

  // Fetch trends data for dashboard
  useEffect(() => {
    const fetchTrends = async () => {
      if (!brandDomain || !projectId) return;
      try {
        const response = await fetch(
          `/api/analyze/trends?projectId=${projectId}&brandDomain=${encodeURIComponent(brandDomain)}&limit=10`
        );
        const data = await response.json();
        if (data.success) {
          setSessionMetrics(data.data.metrics);
        }
      } catch (err) {
        console.error('Error fetching trends:', err);
      }
    };
    fetchTrends();
  }, [projectId, brandDomain]);

  // Update brand info
  const updateBrandInfo = async () => {
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName, brandDomain })
      });
      if (selectedSessionId) {
        fetchSessionKeywords(selectedSessionId);
      }
      setMessage({ type: 'success', text: 'Brand info updated' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update brand info' });
    }
  };

  // Fetch keywords from API
  const handleFetch = async () => {
    const keywordList = keywordsInput
      .split(/[\n,]/)
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keywordList.length === 0) {
      setMessage({ type: 'error', text: 'Please enter at least one keyword' });
      return;
    }

    setFetching(true);
    setMessage(null);

    try {
      const response = await fetch('/api/fetch-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          keywords: keywordList,
          locationCode,
          languageCode,
          sessionName: sessionName || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Created session with ${data.data.savedCount} keywords (${data.data.errorCount} errors)`
        });
        setKeywordsInput('');
        setSessionName('');
        fetchProject();
        setSelectedSessionId(data.data.sessionId);
        setShowPastSession(false);
        setActiveView('keywords');
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch keywords' });
    } finally {
      setFetching(false);
    }
  };

  // Upload JSON file
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('projectId', projectId.toString());
      formData.append('file', file);
      if (sessionName) {
        formData.append('sessionName', sessionName);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: `Created session with ${data.data.savedCount} keywords` });
        setSessionName('');
        fetchProject();
        setSelectedSessionId(data.data.sessionId);
        setShowPastSession(false);
        setActiveView('keywords');
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload file' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId: number) => {
    try {
      await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      fetchProject();
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
        setKeywords([]);
        setActiveView('keywords');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  // Handle selecting a session
  const handleViewSession = (sessionId: string) => {
    const id = parseInt(sessionId, 10);
    setSelectedSessionId(id);
    setShowPastSession(sessions.length > 0 && sessions[0].id !== id);
    setActiveView('keywords');
  };

  // Return to latest session
  const handleReturnToLatest = () => {
    if (sessions.length > 0) {
      setSelectedSessionId(sessions[0].id);
      setShowPastSession(false);
    }
  };

  // Start comparison
  const handleStartComparison = () => {
    if (sessions.length >= 2) {
      setSelectedForComparison([sessions[0].id, sessions[1].id]);
      setShowComparison(true);
    }
  };

  // Run competitor analysis on the currently selected session
  const runAnalysis = useCallback(async () => {
    if (!brandName || !brandDomain) {
      setAnalysisError('Please configure brand name and domain first');
      return;
    }

    if (!selectedSessionId) {
      setAnalysisError('Please select a session first');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, brandName, brandDomain, sessionId: selectedSessionId })
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.data);
      } else {
        setAnalysisError(data.error);
      }
    } catch {
      setAnalysisError('Failed to run analysis');
    } finally {
      setAnalyzing(false);
    }
  }, [projectId, brandName, brandDomain, selectedSessionId]);

  // Export CSV for the currently selected session
  const exportCSV = (type: 'keywords' | 'competitors') => {
    const url = `/api/analyze?projectId=${projectId}&brandName=${encodeURIComponent(brandName)}&brandDomain=${encodeURIComponent(brandDomain)}&format=csv&type=${type}&sessionId=${selectedSessionId}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas-subtle)]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--color-accent-fg)]" />
          <p className="text-sm text-[var(--color-fg-muted)]">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas-subtle)]">
        <div className="gh-box p-8 w-[400px] text-center">
          <div className="h-16 w-16 rounded-md bg-[var(--color-canvas-subtle)] flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-[var(--color-fg-subtle)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-fg-default)] mb-1">Project not found</h2>
          <p className="text-[var(--color-fg-muted)] text-sm mb-6">The project you&apos;re looking for doesn&apos;t exist.</p>
          <Button asChild variant="outline" className="rounded-md">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const aioCount = keywords.filter(k => k.hasAIOverview).length;

  const navItems = [
    { id: 'keywords', label: 'Keywords', icon: Search },
    { id: 'fetch', label: 'Fetch New', icon: Plus },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-canvas-subtle)]">
      <Sidebar currentProjectId={projectId} />

      {/* Main Content with left margin for sidebar */}
      <div className="pl-64">
        {/* Project Header */}
        <header className="sticky top-0 z-30 border-b border-[var(--color-border-default)] bg-[var(--color-canvas-default)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-canvas-default)]/60">
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-[var(--color-neutral-muted)] to-[var(--color-canvas-subtle)] text-sm font-bold text-[var(--color-fg-muted)]">
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[var(--color-fg-default)]">{project.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  {brandDomain ? (
                    <div className="flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)]">
                      <Globe className="h-3.5 w-3.5" />
                      {brandDomain}
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--color-warning-fg)]">No brand configured</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {sessions.length >= 2 && (
                <Button variant="outline" size="sm" onClick={handleStartComparison} className="rounded-md border-[var(--color-border-default)]">
                  <Layers className="mr-2 h-4 w-4" />
                  Compare Sessions
                </Button>
              )}
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-1 px-8 pb-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id as typeof activeView);
                    if (item.id === 'dashboard' && !analysis && !analyzing) {
                      runAnalysis();
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[var(--color-accent-emphasis)] text-white shadow-[var(--color-shadow-small)]'
                      : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-neutral-muted)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-8">
          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-md border ${
              message.type === 'success'
                ? 'bg-[var(--color-success-subtle)] text-[var(--color-success-fg)] border-[var(--color-success-muted)]'
                : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger-fg)] border-[var(--color-danger-muted)]'
            }`}>
              {message.text}
            </div>
          )}

          {/* Keywords View */}
          {activeView === 'keywords' && (
            <div className="space-y-6">
              {selectedSession ? (
                <>
                  {/* Past session banner */}
                  {showPastSession && (
                    <div className="flex items-center justify-between p-4 rounded-md border bg-[var(--color-warning-subtle)] border-[var(--color-warning-muted)]">
                      <div className="flex items-center gap-3 text-[var(--color-warning-fg)]">
                        <Clock className="h-5 w-5" />
                        <span>
                          Viewing past session: <strong>{selectedSession.name || `Session ${selectedSession.id}`}</strong>
                        </span>
                      </div>
                      <Button size="sm" variant="outline" onClick={handleReturnToLatest} className="rounded-md">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Return to Latest
                      </Button>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="gh-box p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-md bg-[var(--color-accent-subtle)] flex items-center justify-center">
                          <Search className="h-5 w-5 text-[var(--color-accent-fg)]" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[var(--color-fg-default)]">{keywords.length}</div>
                          <p className="text-sm text-[var(--color-fg-muted)]">Keywords</p>
                        </div>
                      </div>
                    </div>
                    <div className="gh-box p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-md bg-[var(--color-success-subtle)] flex items-center justify-center">
                          <Eye className="h-5 w-5 text-[var(--color-success-fg)]" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[var(--color-success-fg)]">{aioCount}</div>
                          <p className="text-sm text-[var(--color-fg-muted)]">AI Overviews</p>
                        </div>
                      </div>
                    </div>
                    <div className="gh-box p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-md bg-[var(--color-accent-subtle)] flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-[var(--color-accent-fg)]" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[var(--color-accent-fg)]">
                            {keywords.length > 0 ? ((aioCount / keywords.length) * 100).toFixed(0) : 0}%
                          </div>
                          <p className="text-sm text-[var(--color-fg-muted)]">AIO Rate</p>
                        </div>
                      </div>
                    </div>
                    <div className="gh-box p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-md bg-[var(--color-warning-subtle)] flex items-center justify-center">
                          <Globe className="h-5 w-5 text-[var(--color-warning-fg)]" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[var(--color-warning-fg)]">
                            {keywords.filter(k => k.brandRank !== null).length}
                          </div>
                          <p className="text-sm text-[var(--color-fg-muted)]">Brand Cited</p>
                        </div>
                      </div>
                    </div>
                    <div className="gh-box p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-md bg-[var(--color-canvas-subtle)] flex items-center justify-center">
                          <Layers className="h-5 w-5 text-[var(--color-fg-muted)]" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[var(--color-fg-default)]">{sessions.length}</div>
                          <p className="text-sm text-[var(--color-fg-muted)]">Sessions</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Session Selector Card */}
                  <div className="gh-box p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-[var(--color-fg-muted)]">Current Session:</span>
                            <Select
                              value={selectedSessionId?.toString()}
                              onValueChange={handleViewSession}
                            >
                              <SelectTrigger className="w-[260px] h-9 rounded-md border-[var(--color-border-default)]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-md">
                                {sessions.map((session, idx) => (
                                  <SelectItem key={session.id} value={session.id.toString()}>
                                    {session.name || `Session ${session.id}`} {idx === 0 ? '(Latest)' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!showPastSession && sessions[0]?.id === selectedSession.id && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-success-subtle)] text-[var(--color-success-fg)]">
                                Latest
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[var(--color-fg-muted)]">
                            {new Date(selectedSession.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {previousSession && !showPastSession && (
                          <span className="text-sm text-[var(--color-fg-muted)]">
                            Comparing to: {previousSession.name || `Session ${previousSession.id}`}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[var(--color-fg-muted)] hover:text-[var(--color-danger-fg)] hover:bg-[var(--color-danger-subtle)] rounded-md"
                          onClick={() => {
                            if (confirm('Delete this session? This cannot be undone.')) {
                              handleDeleteSession(selectedSession.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Keywords Table */}
                  <div className="gh-box p-6">
                    {keywords.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="h-16 w-16 rounded-md bg-[var(--color-canvas-subtle)] flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-[var(--color-fg-subtle)]" />
                        </div>
                        <p className="text-lg font-semibold text-[var(--color-fg-default)] mb-1">No keywords in this session</p>
                        <p className="text-sm text-[var(--color-fg-muted)]">Fetch new keywords or upload data to get started</p>
                      </div>
                    ) : (
                      <KeywordsTable
                        keywords={keywords}
                        projectId={projectId}
                        brandDomain={brandDomain}
                        brandName={brandName}
                        showChanges={previousSession !== null}
                        previousSessionName={previousSession?.name || (previousSession ? `Session ${previousSession.id}` : null)}
                        rankHistory={rankHistory || undefined}
                        onViewSession={(sessionId) => {
                          setSelectedSessionId(sessionId);
                          setShowPastSession(sessions.length > 0 && sessions[0].id !== sessionId);
                        }}
                      />
                    )}
                  </div>
                </>
              ) : sessions.length === 0 ? (
                <div className="gh-box p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-[var(--color-canvas-subtle)] rounded-md flex items-center justify-center">
                    <Search className="w-10 h-10 text-[var(--color-fg-subtle)]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-fg-default)] mb-2">No keywords yet</h3>
                  <p className="text-[var(--color-fg-muted)] mb-6 max-w-md mx-auto">
                    Get started by fetching keywords from the DataForSEO API or uploading existing data
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => setActiveView('fetch')} size="lg" className="rounded-md bg-[var(--color-accent-emphasis)] hover:bg-[var(--color-accent-emphasis)]/90">
                      <Plus className="mr-2 h-5 w-5" />
                      Fetch Keywords
                    </Button>
                    <Button variant="outline" onClick={() => setActiveView('upload')} size="lg" className="rounded-md border-[var(--color-border-default)]">
                      <Upload className="mr-2 h-5 w-5" />
                      Upload JSON
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Fetch View */}
          {activeView === 'fetch' && (
            <div className="max-w-2xl mx-auto">
              <div className="gh-box overflow-hidden">
                <div className="px-8 py-6 border-b border-[var(--color-border-default)]">
                  <h2 className="text-lg font-semibold text-[var(--color-fg-default)]">Fetch New Keywords</h2>
                  <p className="text-sm text-[var(--color-fg-muted)] mt-1">
                    Enter keywords to fetch AI Overview data from DataForSEO
                  </p>
                </div>
                <div className="p-8 space-y-6">
                  {/* Brand config reminder */}
                  {!brandDomain && (
                    <div className="p-4 rounded-md border bg-[var(--color-warning-subtle)] border-[var(--color-warning-muted)]">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-[var(--color-warning-fg)] mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-[var(--color-warning-fg)]">Set up brand tracking first</p>
                          <p className="text-sm text-[var(--color-warning-fg)] mt-1">
                            Configure your brand domain to track your citation rank.
                          </p>
                          <div className="mt-4 flex gap-3">
                            <Input
                              value={brandDomain}
                              onChange={(e) => setBrandDomain(e.target.value)}
                              placeholder="yourdomain.com"
                              className="flex-1 rounded-md border-[var(--color-border-default)]"
                            />
                            <Button onClick={updateBrandInfo} variant="secondary" className="rounded-md">
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-fg-default)]">Session Name (optional)</label>
                    <Input
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="e.g., December 2024 Check"
                      className="h-11 rounded-md border-[var(--color-border-default)] focus:border-[var(--color-accent-emphasis)] focus:ring-[var(--color-accent-emphasis)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-fg-default)]">Keywords</label>
                    <Textarea
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      placeholder="One keyword per line or comma-separated"
                      rows={10}
                      className="font-mono text-sm rounded-md border-[var(--color-border-default)] focus:border-[var(--color-accent-emphasis)] focus:ring-[var(--color-accent-emphasis)]"
                    />
                    <p className="text-xs text-[var(--color-fg-subtle)]">
                      {keywordsInput.split(/[\n,]/).filter(k => k.trim()).length} keywords entered
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-fg-default)]">Location Code</label>
                      <Input
                        value={locationCode}
                        onChange={(e) => setLocationCode(e.target.value)}
                        className="h-11 rounded-md border-[var(--color-border-default)] focus:border-[var(--color-accent-emphasis)] focus:ring-[var(--color-accent-emphasis)]"
                      />
                      <p className="text-xs text-[var(--color-fg-subtle)]">2704 = Vietnam, 2840 = USA</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-fg-default)]">Language Code</label>
                      <Input
                        value={languageCode}
                        onChange={(e) => setLanguageCode(e.target.value)}
                        className="h-11 rounded-md border-[var(--color-border-default)] focus:border-[var(--color-accent-emphasis)] focus:ring-[var(--color-accent-emphasis)]"
                      />
                      <p className="text-xs text-[var(--color-fg-subtle)]">vi = Vietnamese, en = English</p>
                    </div>
                  </div>

                  <Separator className="bg-[var(--color-border-default)]" />

                  <Button onClick={handleFetch} disabled={fetching} className="w-full h-12 rounded-md bg-[var(--color-accent-emphasis)] hover:bg-[var(--color-accent-emphasis)]/90" size="lg">
                    {fetching ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Fetching Keywords...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-5 w-5" />
                        Fetch Keywords
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Upload View */}
          {activeView === 'upload' && (
            <div className="max-w-2xl mx-auto">
              <div className="gh-box overflow-hidden">
                <div className="px-8 py-6 border-b border-[var(--color-border-default)]">
                  <h2 className="text-lg font-semibold text-[var(--color-fg-default)]">Upload JSON Data</h2>
                  <p className="text-sm text-[var(--color-fg-muted)] mt-1">
                    Upload a DataForSEO JSON file to import keyword data
                  </p>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-fg-default)]">Session Name (optional)</label>
                    <Input
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="e.g., Imported Data - Dec 2024"
                      className="h-11 rounded-md border-[var(--color-border-default)] focus:border-[var(--color-accent-emphasis)] focus:ring-[var(--color-accent-emphasis)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-fg-default)]">JSON File</label>
                    <div className="border-2 border-dashed border-[var(--color-border-default)] rounded-md p-12 text-center hover:border-[var(--color-accent-emphasis)] transition-colors cursor-pointer bg-[var(--color-canvas-subtle)]/50">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleUpload}
                        disabled={uploading}
                        className="hidden"
                        id="json-upload"
                      />
                      <label htmlFor="json-upload" className="cursor-pointer">
                        <div className="h-16 w-16 rounded-md bg-[var(--color-canvas-default)] border border-[var(--color-border-default)] flex items-center justify-center mx-auto mb-4">
                          <Upload className="w-8 h-8 text-[var(--color-fg-subtle)]" />
                        </div>
                        <p className="text-lg mb-1">
                          <span className="text-[var(--color-accent-fg)] font-medium">Click to upload</span>
                          <span className="text-[var(--color-fg-muted)]"> or drag and drop</span>
                        </p>
                        <p className="text-sm text-[var(--color-fg-subtle)]">JSON files only</p>
                      </label>
                    </div>
                    {uploading && (
                      <div className="flex items-center justify-center gap-3 py-4 text-[var(--color-fg-muted)]">
                        <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent-fg)]" />
                        Uploading and processing...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard View */}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              {/* Brand config warning */}
              {(!brandName || !brandDomain) && (
                <div className="rounded-md p-5 border-[var(--color-warning-muted)] bg-[var(--color-warning-subtle)] border">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-[var(--color-warning-fg)] mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-[var(--color-warning-fg)]">Configure brand to run analysis</p>
                      <p className="text-sm text-[var(--color-warning-fg)] mt-1">
                        Set your brand name and domain to see competitor analysis.
                      </p>
                      <div className="mt-4 flex gap-3">
                        <Input
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="Brand Name"
                          className="flex-1 rounded-md border-[var(--color-border-default)]"
                        />
                        <Input
                          value={brandDomain}
                          onChange={(e) => setBrandDomain(e.target.value)}
                          placeholder="yourdomain.com"
                          className="flex-1 rounded-md border-[var(--color-border-default)]"
                        />
                        <Button onClick={() => { updateBrandInfo(); runAnalysis(); }} className="rounded-md bg-[var(--color-accent-emphasis)] hover:bg-[var(--color-accent-emphasis)]/90">
                          Save & Analyze
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {analyzing && (
                <div className="gh-box p-16 text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[var(--color-accent-fg)]" />
                  <p className="text-[var(--color-fg-muted)]">Running competitor analysis...</p>
                </div>
              )}

              {/* Error state */}
              {analysisError && (
                <div className="rounded-md p-5 border-[var(--color-danger-muted)] bg-[var(--color-danger-subtle)] border">
                  <div className="flex items-center gap-3 text-[var(--color-danger-fg)]">
                    <AlertTriangle className="h-6 w-6" />
                    <span className="flex-1">{analysisError}</span>
                    <Button variant="outline" onClick={runAnalysis} size="sm" className="rounded-md">
                      Try again
                    </Button>
                  </div>
                </div>
              )}

              {/* Analysis results */}
              {analysis && !analyzing && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--color-fg-default)]">Competitor Analysis</h2>
                      {selectedSession && (
                        <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">
                          Analyzing: {selectedSession.name || `Session ${selectedSession.id}`}
                          {showPastSession && <span className="text-[var(--color-warning-fg)] ml-2">(Past session)</span>}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={runAnalysis} className="rounded-md border-[var(--color-border-default)]">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                      <Button size="sm" onClick={() => exportCSV('competitors')} className="rounded-md bg-[var(--color-accent-emphasis)] hover:bg-[var(--color-accent-emphasis)]/90">
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                      </Button>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <SummaryCards
                    totalKeywords={analysis.summary.totalKeywords}
                    aiOverviewsFound={analysis.summary.aiOverviewsFound}
                    competitorsIdentified={analysis.summary.competitorsIdentified}
                    brandCitations={analysis.competitors.find(c => c.isUserBrand)?.citedCount}
                    brandName={brandName}
                  />

                  {/* Competitor Chart */}
                  <CompetitorChart
                    competitors={analysis.competitors}
                    brandName={brandName}
                  />

                  {/* AI-Powered Insights */}
                  {analysis.competitors.length > 0 && (
                    <InsightsPanel
                      competitors={analysis.competitors}
                      brandName={brandName}
                      totalAIOs={analysis.summary.aiOverviewsFound}
                    />
                  )}

                  {/* Rank Distribution Charts - AIO and Organic side by side */}
                  {analysis.keywordsAnalysis.length > 0 && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <RankDistributionChart
                        keywords={analysis.keywordsAnalysis}
                        brandName={brandName}
                        brandDomain={brandDomain}
                      />
                      <OrganicRankDistributionChart
                        keywords={analysis.keywordsAnalysis}
                        brandName={brandName}
                        brandDomain={brandDomain}
                      />
                    </div>
                  )}

                  {/* Performance Trends Over Time */}
                  {sessionMetrics.length > 0 && (
                    <MetricsTrends
                      sessions={sessions}
                      sessionMetrics={sessionMetrics}
                      brandName={brandName}
                    />
                  )}

                  {/* Keyword Performance Grid */}
                  {analysis.keywordsAnalysis.length > 0 && (
                    <KeywordPerformanceGrid
                      keywords={analysis.keywordsAnalysis}
                      brandName={brandName}
                      brandDomain={brandDomain}
                    />
                  )}

                  {/* Brand Performance */}
                  {brandName && (
                    <div className="gh-box overflow-hidden">
                      <div className="bg-gradient-to-r from-[var(--color-accent-emphasis)] to-[var(--color-accent-fg)] px-6 py-4">
                        <h3 className="text-lg font-semibold text-white">Your Brand: {brandName}</h3>
                      </div>
                      <div className="p-6 bg-gradient-to-b from-[var(--color-accent-subtle)]/30 to-[var(--color-canvas-default)]">
                        {(() => {
                          const brandData = analysis.competitors.find(c => c.isUserBrand);
                          const brandRank = analysis.competitors.findIndex(c => c.isUserBrand) + 1;
                          if (!brandData) {
                            return (
                              <div className="text-center py-4">
                                <p className="text-[var(--color-fg-muted)]">
                                  Your brand was not found in AI Overview citations.
                                </p>
                                <p className="text-sm text-[var(--color-fg-subtle)] mt-1">
                                  Try checking your brand domain configuration.
                                </p>
                              </div>
                            );
                          }
                          return (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div className="text-center p-4 rounded-md bg-[var(--color-canvas-default)] shadow-[var(--color-shadow-small)] border border-[var(--color-border-default)]">
                                <div className="text-4xl font-bold text-[var(--color-accent-fg)]">#{brandRank}</div>
                                <div className="text-sm text-[var(--color-fg-muted)] mt-1">Overall Rank</div>
                                <div className="text-xs text-[var(--color-fg-subtle)]">of {analysis.competitors.length} sources</div>
                              </div>
                              <div className="text-center p-4 rounded-md bg-[var(--color-canvas-default)] shadow-[var(--color-shadow-small)] border border-[var(--color-border-default)]">
                                <div className="text-4xl font-bold text-[var(--color-accent-fg)]">{brandData.citedCount}</div>
                                <div className="text-sm text-[var(--color-fg-muted)] mt-1">Citations</div>
                                <div className="text-xs text-[var(--color-fg-subtle)]">times cited as source</div>
                              </div>
                              <div className="text-center p-4 rounded-md bg-[var(--color-canvas-default)] shadow-[var(--color-shadow-small)] border border-[var(--color-border-default)]">
                                <div className="text-4xl font-bold text-[var(--color-accent-fg)]">
                                  {brandData.averageRank > 0 ? brandData.averageRank.toFixed(1) : '-'}
                                </div>
                                <div className="text-sm text-[var(--color-fg-muted)] mt-1">Avg Position</div>
                                <div className="text-xs text-[var(--color-fg-subtle)]">in citation list</div>
                              </div>
                              <div className="text-center p-4 rounded-md bg-[var(--color-canvas-default)] shadow-[var(--color-shadow-small)] border border-[var(--color-border-default)]">
                                <div className="text-4xl font-bold text-[var(--color-success-fg)]">
                                  {(brandData.promptCitedRate * 100).toFixed(1)}%
                                </div>
                                <div className="text-sm text-[var(--color-fg-muted)] mt-1">Citation Rate</div>
                                <div className="text-xs text-[var(--color-fg-subtle)]">of AI Overviews</div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Competitor Table */}
                  <div className="gh-box p-6">
                    <h3 className="text-lg font-semibold text-[var(--color-fg-default)] mb-5">All Competitors</h3>
                    <CompetitorTable
                      competitors={analysis.competitors}
                      brandName={brandName}
                    />
                  </div>
                </>
              )}

              {/* Empty state */}
              {!analysis && !analyzing && !analysisError && brandName && brandDomain && (
                <div className="gh-box p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-[var(--color-canvas-subtle)] rounded-md flex items-center justify-center">
                    <BarChart3 className="w-10 h-10 text-[var(--color-fg-subtle)]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-fg-default)] mb-2">Ready to analyze</h3>
                  <p className="text-[var(--color-fg-muted)] mb-6">Click the button below to run competitor analysis</p>
                  <Button onClick={runAnalysis} size="lg" className="rounded-md bg-[var(--color-accent-emphasis)] hover:bg-[var(--color-accent-emphasis)]/90">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Run Analysis
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Settings View */}
          {activeView === 'settings' && (
            <div className="max-w-2xl mx-auto">
              <div className="gh-box overflow-hidden">
                <div className="px-8 py-6 border-b border-[var(--color-border-default)]">
                  <h2 className="text-lg font-semibold text-[var(--color-fg-default)]">Project Settings</h2>
                  <p className="text-sm text-[var(--color-fg-muted)] mt-1">
                    Configure your brand information for tracking citations
                  </p>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-fg-default)]">Brand Name</label>
                    <Input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Your Brand Name"
                      className="h-11 rounded-md border-[var(--color-border-default)] focus:border-[var(--color-accent-emphasis)] focus:ring-[var(--color-accent-emphasis)]"
                    />
                    <p className="text-xs text-[var(--color-fg-subtle)]">
                      Used to detect brand mentions in AI Overview content
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-fg-default)]">Brand Domain</label>
                    <Input
                      value={brandDomain}
                      onChange={(e) => setBrandDomain(e.target.value)}
                      placeholder="yourdomain.com"
                      className="h-11 rounded-md border-[var(--color-border-default)] focus:border-[var(--color-accent-emphasis)] focus:ring-[var(--color-accent-emphasis)]"
                    />
                    <p className="text-xs text-[var(--color-fg-subtle)]">
                      Used to identify your brand in citation sources
                    </p>
                  </div>

                  <Separator className="bg-[var(--color-border-default)]" />

                  <Button onClick={updateBrandInfo} size="lg" className="rounded-md bg-[var(--color-accent-emphasis)] hover:bg-[var(--color-accent-emphasis)]/90">
                    <Settings className="mr-2 h-5 w-5" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Session Comparison Modal */}
      {showComparison && selectedForComparison.length >= 2 && (
        <SessionComparison
          projectId={projectId}
          sessionIds={selectedForComparison}
          brandDomain={brandDomain}
          onClose={() => {
            setShowComparison(false);
            setSelectedForComparison([]);
          }}
          onViewKeyword={(keyword, sessionId) => {
            setShowComparison(false);
            setSelectedSessionId(sessionId);
            setShowPastSession(sessions.length > 0 && sessions[0].id !== sessionId);
            setActiveView('keywords');
          }}
        />
      )}
    </div>
  );
}
