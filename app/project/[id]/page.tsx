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
      <div className="min-h-screen flex items-center justify-center bg-gray-50/30">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
          <p className="text-sm text-gray-500">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/30">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-[400px] text-center">
          <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Project not found</h2>
          <p className="text-gray-500 text-sm mb-6">The project you&apos;re looking for doesn&apos;t exist.</p>
          <Button asChild variant="outline" className="rounded-xl">
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
    <div className="min-h-screen bg-gray-50/30">
      <Sidebar currentProjectId={projectId} />

      {/* Main Content with left margin for sidebar */}
      <div className="pl-64">
        {/* Project Header */}
        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 text-sm font-bold text-gray-600">
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  {brandDomain ? (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Globe className="h-3.5 w-3.5" />
                      {brandDomain}
                    </div>
                  ) : (
                    <span className="text-sm text-amber-600">No brand configured</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {sessions.length >= 2 && (
                <Button variant="outline" size="sm" onClick={handleStartComparison} className="rounded-xl border-gray-200">
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
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
            <div className={`mb-6 p-4 rounded-xl border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
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
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-amber-50 border-amber-200">
                      <div className="flex items-center gap-3 text-amber-900">
                        <Clock className="h-5 w-5" />
                        <span>
                          Viewing past session: <strong>{selectedSession.name || `Session ${selectedSession.id}`}</strong>
                        </span>
                      </div>
                      <Button size="sm" variant="outline" onClick={handleReturnToLatest} className="rounded-xl">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Return to Latest
                      </Button>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Search className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{keywords.length}</div>
                          <p className="text-sm text-gray-500">Keywords</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <Eye className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-emerald-600">{aioCount}</div>
                          <p className="text-sm text-gray-500">AI Overviews</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-purple-50 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {keywords.length > 0 ? ((aioCount / keywords.length) * 100).toFixed(0) : 0}%
                          </div>
                          <p className="text-sm text-gray-500">AIO Rate</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center">
                          <Globe className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-amber-600">
                            {keywords.filter(k => k.brandRank !== null).length}
                          </div>
                          <p className="text-sm text-gray-500">Brand Cited</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-gray-50 flex items-center justify-center">
                          <Layers className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{sessions.length}</div>
                          <p className="text-sm text-gray-500">Sessions</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Session Selector Card */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">Current Session:</span>
                            <Select
                              value={selectedSessionId?.toString()}
                              onValueChange={handleViewSession}
                            >
                              <SelectTrigger className="w-[260px] h-9 rounded-xl border-gray-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {sessions.map((session, idx) => (
                                  <SelectItem key={session.id} value={session.id.toString()}>
                                    {session.name || `Session ${session.id}`} {idx === 0 ? '(Latest)' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!showPastSession && sessions[0]?.id === selectedSession.id && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                Latest
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
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
                          <span className="text-sm text-gray-500">
                            Comparing to: {previousSession.name || `Session ${previousSession.id}`}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
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
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    {keywords.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900 mb-1">No keywords in this session</p>
                        <p className="text-sm text-gray-500">Fetch new keywords or upload data to get started</p>
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-50 rounded-2xl flex items-center justify-center">
                    <Search className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No keywords yet</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Get started by fetching keywords from the DataForSEO API or uploading existing data
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => setActiveView('fetch')} size="lg" className="rounded-xl bg-gray-900 hover:bg-gray-800">
                      <Plus className="mr-2 h-5 w-5" />
                      Fetch Keywords
                    </Button>
                    <Button variant="outline" onClick={() => setActiveView('upload')} size="lg" className="rounded-xl border-gray-200">
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Fetch New Keywords</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter keywords to fetch AI Overview data from DataForSEO
                  </p>
                </div>
                <div className="p-8 space-y-6">
                  {/* Brand config reminder */}
                  {!brandDomain && (
                    <div className="p-4 rounded-xl border bg-amber-50 border-amber-200">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-amber-900">Set up brand tracking first</p>
                          <p className="text-sm text-amber-700 mt-1">
                            Configure your brand domain to track your citation rank.
                          </p>
                          <div className="mt-4 flex gap-3">
                            <Input
                              value={brandDomain}
                              onChange={(e) => setBrandDomain(e.target.value)}
                              placeholder="yourdomain.com"
                              className="flex-1 rounded-xl border-gray-200"
                            />
                            <Button onClick={updateBrandInfo} variant="secondary" className="rounded-xl">
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Session Name (optional)</label>
                    <Input
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="e.g., December 2024 Check"
                      className="h-11 rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Keywords</label>
                    <Textarea
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      placeholder="One keyword per line or comma-separated"
                      rows={10}
                      className="font-mono text-sm rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                    />
                    <p className="text-xs text-gray-400">
                      {keywordsInput.split(/[\n,]/).filter(k => k.trim()).length} keywords entered
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Location Code</label>
                      <Input
                        value={locationCode}
                        onChange={(e) => setLocationCode(e.target.value)}
                        className="h-11 rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                      />
                      <p className="text-xs text-gray-400">2704 = Vietnam, 2840 = USA</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Language Code</label>
                      <Input
                        value={languageCode}
                        onChange={(e) => setLanguageCode(e.target.value)}
                        className="h-11 rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                      />
                      <p className="text-xs text-gray-400">vi = Vietnamese, en = English</p>
                    </div>
                  </div>

                  <Separator className="bg-gray-100" />

                  <Button onClick={handleFetch} disabled={fetching} className="w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800" size="lg">
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Upload JSON Data</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload a DataForSEO JSON file to import keyword data
                  </p>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Session Name (optional)</label>
                    <Input
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="e.g., Imported Data - Dec 2024"
                      className="h-11 rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">JSON File</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-indigo-300 transition-colors cursor-pointer bg-gray-50/50">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleUpload}
                        disabled={uploading}
                        className="hidden"
                        id="json-upload"
                      />
                      <label htmlFor="json-upload" className="cursor-pointer">
                        <div className="h-16 w-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">
                          <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg mb-1">
                          <span className="text-indigo-600 font-medium">Click to upload</span>
                          <span className="text-gray-500"> or drag and drop</span>
                        </p>
                        <p className="text-sm text-gray-400">JSON files only</p>
                      </label>
                    </div>
                    {uploading && (
                      <div className="flex items-center justify-center gap-3 py-4 text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
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
                <div className="rounded-2xl p-5 border-amber-200 bg-amber-50 border">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-900">Configure brand to run analysis</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Set your brand name and domain to see competitor analysis.
                      </p>
                      <div className="mt-4 flex gap-3">
                        <Input
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="Brand Name"
                          className="flex-1 rounded-xl border-gray-200"
                        />
                        <Input
                          value={brandDomain}
                          onChange={(e) => setBrandDomain(e.target.value)}
                          placeholder="yourdomain.com"
                          className="flex-1 rounded-xl border-gray-200"
                        />
                        <Button onClick={() => { updateBrandInfo(); runAnalysis(); }} className="rounded-xl bg-gray-900 hover:bg-gray-800">
                          Save & Analyze
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {analyzing && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-indigo-600" />
                  <p className="text-gray-500">Running competitor analysis...</p>
                </div>
              )}

              {/* Error state */}
              {analysisError && (
                <div className="rounded-2xl p-5 border-red-200 bg-red-50 border">
                  <div className="flex items-center gap-3 text-red-700">
                    <AlertTriangle className="h-6 w-6" />
                    <span className="flex-1">{analysisError}</span>
                    <Button variant="outline" onClick={runAnalysis} size="sm" className="rounded-xl">
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
                      <h2 className="text-xl font-semibold text-gray-900">Competitor Analysis</h2>
                      {selectedSession && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          Analyzing: {selectedSession.name || `Session ${selectedSession.id}`}
                          {showPastSession && <span className="text-amber-600 ml-2">(Past session)</span>}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={runAnalysis} className="rounded-xl border-gray-200">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                      <Button size="sm" onClick={() => exportCSV('competitors')} className="rounded-xl bg-gray-900 hover:bg-gray-800">
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

                  {/* Rank Distribution Chart */}
                  {analysis.keywordsAnalysis.length > 0 && (
                    <RankDistributionChart
                      keywords={analysis.keywordsAnalysis}
                      brandName={brandName}
                      brandDomain={brandDomain}
                    />
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
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                        <h3 className="text-lg font-semibold text-white">Your Brand: {brandName}</h3>
                      </div>
                      <div className="p-6 bg-gradient-to-b from-indigo-50/30 to-white">
                        {(() => {
                          const brandData = analysis.competitors.find(c => c.isUserBrand);
                          const brandRank = analysis.competitors.findIndex(c => c.isUserBrand) + 1;
                          if (!brandData) {
                            return (
                              <div className="text-center py-4">
                                <p className="text-gray-500">
                                  Your brand was not found in AI Overview citations.
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                  Try checking your brand domain configuration.
                                </p>
                              </div>
                            );
                          }
                          return (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div className="text-center p-4 rounded-xl bg-white shadow-sm border border-gray-100">
                                <div className="text-4xl font-bold text-indigo-600">#{brandRank}</div>
                                <div className="text-sm text-gray-500 mt-1">Overall Rank</div>
                                <div className="text-xs text-gray-400">of {analysis.competitors.length} sources</div>
                              </div>
                              <div className="text-center p-4 rounded-xl bg-white shadow-sm border border-gray-100">
                                <div className="text-4xl font-bold text-blue-600">{brandData.citedCount}</div>
                                <div className="text-sm text-gray-500 mt-1">Citations</div>
                                <div className="text-xs text-gray-400">times cited as source</div>
                              </div>
                              <div className="text-center p-4 rounded-xl bg-white shadow-sm border border-gray-100">
                                <div className="text-4xl font-bold text-purple-600">
                                  {brandData.averageRank > 0 ? brandData.averageRank.toFixed(1) : '-'}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">Avg Position</div>
                                <div className="text-xs text-gray-400">in citation list</div>
                              </div>
                              <div className="text-center p-4 rounded-xl bg-white shadow-sm border border-gray-100">
                                <div className="text-4xl font-bold text-emerald-600">
                                  {(brandData.promptCitedRate * 100).toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-500 mt-1">Citation Rate</div>
                                <div className="text-xs text-gray-400">of AI Overviews</div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Competitor Table */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-5">All Competitors</h3>
                    <CompetitorTable
                      competitors={analysis.competitors}
                      brandName={brandName}
                    />
                  </div>
                </>
              )}

              {/* Empty state */}
              {!analysis && !analyzing && !analysisError && brandName && brandDomain && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-50 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to analyze</h3>
                  <p className="text-gray-500 mb-6">Click the button below to run competitor analysis</p>
                  <Button onClick={runAnalysis} size="lg" className="rounded-xl bg-gray-900 hover:bg-gray-800">
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Project Settings</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure your brand information for tracking citations
                  </p>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Brand Name</label>
                    <Input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Your Brand Name"
                      className="h-11 rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                    />
                    <p className="text-xs text-gray-400">
                      Used to detect brand mentions in AI Overview content
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Brand Domain</label>
                    <Input
                      value={brandDomain}
                      onChange={(e) => setBrandDomain(e.target.value)}
                      placeholder="yourdomain.com"
                      className="h-11 rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                    />
                    <p className="text-xs text-gray-400">
                      Used to identify your brand in citation sources
                    </p>
                  </div>

                  <Separator className="bg-gray-100" />

                  <Button onClick={updateBrandInfo} size="lg" className="rounded-xl bg-gray-900 hover:bg-gray-800">
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
