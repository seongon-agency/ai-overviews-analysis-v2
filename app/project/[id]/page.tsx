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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <CardTitle>Project not found</CardTitle>
            <CardDescription>The project you&apos;re looking for doesn&apos;t exist.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
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
    <div className="min-h-screen bg-background">
      <Sidebar currentProjectId={projectId} />

      {/* Main Content with left margin for sidebar */}
      <div className="pl-64">
        {/* Project Header */}
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-lg font-semibold">{project.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  {brandDomain ? (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
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
                <Button variant="outline" size="sm" onClick={handleStartComparison}>
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 text-green-900 border-green-200'
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
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-amber-50 border-amber-200">
                      <div className="flex items-center gap-3 text-amber-900">
                        <Clock className="h-5 w-5" />
                        <span>
                          Viewing past session: <strong>{selectedSession.name || `Session ${selectedSession.id}`}</strong>
                        </span>
                      </div>
                      <Button size="sm" variant="outline" onClick={handleReturnToLatest}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Return to Latest
                      </Button>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-100">
                          <Search className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{keywords.length}</div>
                          <p className="text-sm text-muted-foreground">Keywords</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-green-100">
                          <Eye className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{aioCount}</div>
                          <p className="text-sm text-muted-foreground">AI Overviews</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-purple-100">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {keywords.length > 0 ? ((aioCount / keywords.length) * 100).toFixed(0) : 0}%
                          </div>
                          <p className="text-sm text-muted-foreground">AIO Rate</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-amber-100">
                          <Globe className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-amber-600">
                            {keywords.filter(k => k.brandRank !== null).length}
                          </div>
                          <p className="text-sm text-muted-foreground">Brand Cited</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-gray-100">
                          <Layers className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{sessions.length}</div>
                          <p className="text-sm text-muted-foreground">Sessions</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Session Selector Card */}
                  <Card className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">Current Session:</span>
                            <Select
                              value={selectedSessionId?.toString()}
                              onValueChange={handleViewSession}
                            >
                              <SelectTrigger className="w-[260px] h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {sessions.map((session, idx) => (
                                  <SelectItem key={session.id} value={session.id.toString()}>
                                    {session.name || `Session ${session.id}`} {idx === 0 ? '(Latest)' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!showPastSession && sessions[0]?.id === selectedSession.id && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                Latest
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
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
                          <span className="text-sm text-muted-foreground">
                            Comparing to: {previousSession.name || `Session ${previousSession.id}`}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
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
                  </Card>

                  {/* Keywords Table */}
                  <Card className="p-6">
                    {keywords.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No keywords in this session</p>
                        <p className="text-sm mt-1">Fetch new keywords or upload data to get started</p>
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
                  </Card>
                </>
              ) : sessions.length === 0 ? (
                <Card className="p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                    <Search className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No keywords yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Get started by fetching keywords from the DataForSEO API or uploading existing data
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => setActiveView('fetch')} size="lg">
                      <Plus className="mr-2 h-5 w-5" />
                      Fetch Keywords
                    </Button>
                    <Button variant="outline" onClick={() => setActiveView('upload')} size="lg">
                      <Upload className="mr-2 h-5 w-5" />
                      Upload JSON
                    </Button>
                  </div>
                </Card>
              ) : null}
            </div>
          )}

          {/* Fetch View */}
          {activeView === 'fetch' && (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Fetch New Keywords</CardTitle>
                  <CardDescription>
                    Enter keywords to fetch AI Overview data from DataForSEO
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Brand config reminder */}
                  {!brandDomain && (
                    <div className="p-4 rounded-lg border bg-amber-50 border-amber-200">
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
                              className="flex-1"
                            />
                            <Button onClick={updateBrandInfo} variant="secondary">
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Session Name (optional)</label>
                    <Input
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="e.g., December 2024 Check"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Keywords</label>
                    <Textarea
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      placeholder="One keyword per line or comma-separated"
                      rows={10}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {keywordsInput.split(/[\n,]/).filter(k => k.trim()).length} keywords entered
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location Code</label>
                      <Input
                        value={locationCode}
                        onChange={(e) => setLocationCode(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">2704 = Vietnam, 2840 = USA</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Language Code</label>
                      <Input
                        value={languageCode}
                        onChange={(e) => setLanguageCode(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">vi = Vietnamese, en = English</p>
                    </div>
                  </div>

                  <Separator />

                  <Button onClick={handleFetch} disabled={fetching} className="w-full" size="lg">
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
                </CardContent>
              </Card>
            </div>
          )}

          {/* Upload View */}
          {activeView === 'upload' && (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Upload JSON Data</CardTitle>
                  <CardDescription>
                    Upload a DataForSEO JSON file to import keyword data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Session Name (optional)</label>
                    <Input
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="e.g., Imported Data - Dec 2024"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">JSON File</label>
                    <div className="border-2 border-dashed rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleUpload}
                        disabled={uploading}
                        className="hidden"
                        id="json-upload"
                      />
                      <label htmlFor="json-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg mb-1">
                          <span className="text-primary font-medium">Click to upload</span>
                          <span className="text-muted-foreground"> or drag and drop</span>
                        </p>
                        <p className="text-sm text-muted-foreground">JSON files only</p>
                      </label>
                    </div>
                    {uploading && (
                      <div className="flex items-center justify-center gap-3 py-4 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Uploading and processing...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dashboard View */}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              {/* Brand config warning */}
              {(!brandName || !brandDomain) && (
                <Card className="p-5 border-amber-200 bg-amber-50">
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
                          className="flex-1"
                        />
                        <Input
                          value={brandDomain}
                          onChange={(e) => setBrandDomain(e.target.value)}
                          placeholder="yourdomain.com"
                          className="flex-1"
                        />
                        <Button onClick={() => { updateBrandInfo(); runAnalysis(); }}>
                          Save & Analyze
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Loading state */}
              {analyzing && (
                <Card className="p-16 text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Running competitor analysis...</p>
                </Card>
              )}

              {/* Error state */}
              {analysisError && (
                <Card className="p-5 border-destructive bg-destructive/10">
                  <div className="flex items-center gap-3 text-destructive">
                    <AlertTriangle className="h-6 w-6" />
                    <span className="flex-1">{analysisError}</span>
                    <Button variant="outline" onClick={runAnalysis} size="sm">
                      Try again
                    </Button>
                  </div>
                </Card>
              )}

              {/* Analysis results */}
              {analysis && !analyzing && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Competitor Analysis</h2>
                      {selectedSession && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Analyzing: {selectedSession.name || `Session ${selectedSession.id}`}
                          {showPastSession && <span className="text-amber-600 ml-2">(Past session)</span>}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={runAnalysis}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                      <Button size="sm" onClick={() => exportCSV('competitors')}>
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

                  {/* Brand Performance */}
                  {brandName && (
                    <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                      <h3 className="text-lg font-semibold mb-5">{brandName} Performance</h3>
                      {(() => {
                        const brandData = analysis.competitors.find(c => c.isUserBrand);
                        if (!brandData) {
                          return (
                            <p className="text-muted-foreground">
                              Your brand was not found in AI Overview citations or mentions.
                            </p>
                          );
                        }
                        return (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                              <div className="text-3xl font-bold text-amber-700">{brandData.citedCount}</div>
                              <div className="text-sm text-muted-foreground mt-1">Times Cited</div>
                            </div>
                            <div>
                              <div className="text-3xl font-bold text-orange-700">{brandData.mentionedCount}</div>
                              <div className="text-sm text-muted-foreground mt-1">Times Mentioned</div>
                            </div>
                            <div>
                              <div className="text-3xl font-bold text-amber-700">
                                {brandData.averageRank > 0 ? brandData.averageRank.toFixed(1) : '-'}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">Avg Citation Rank</div>
                            </div>
                            <div>
                              <div className="text-3xl font-bold text-orange-700">
                                {(brandData.promptCitedRate * 100).toFixed(1)}%
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">Citation Rate</div>
                            </div>
                          </div>
                        );
                      })()}
                    </Card>
                  )}

                  {/* Competitor Table */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-5">All Competitors</h3>
                    <CompetitorTable
                      competitors={analysis.competitors}
                      brandName={brandName}
                    />
                  </Card>
                </>
              )}

              {/* Empty state */}
              {!analysis && !analyzing && !analysisError && brandName && brandDomain && (
                <Card className="p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                    <BarChart3 className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Ready to analyze</h3>
                  <p className="text-muted-foreground mb-6">Click the button below to run competitor analysis</p>
                  <Button onClick={runAnalysis} size="lg">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Run Analysis
                  </Button>
                </Card>
              )}
            </div>
          )}

          {/* Settings View */}
          {activeView === 'settings' && (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Project Settings</CardTitle>
                  <CardDescription>
                    Configure your brand information for tracking citations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Name</label>
                    <Input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Your Brand Name"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used to detect brand mentions in AI Overview content
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Domain</label>
                    <Input
                      value={brandDomain}
                      onChange={(e) => setBrandDomain(e.target.value)}
                      placeholder="yourdomain.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used to identify your brand in citation sources
                    </p>
                  </div>

                  <Separator />

                  <Button onClick={updateBrandInfo} size="lg">
                    <Settings className="mr-2 h-5 w-5" />
                    Save Settings
                  </Button>
                </CardContent>
              </Card>
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
