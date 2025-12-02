'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Project, KeywordRecord, Reference, CheckSessionWithStats } from '@/lib/types';
import { KeywordsTable } from '@/components/KeywordsTable';
import { SessionList } from '@/components/sessions/SessionList';
import { SessionComparison } from '@/components/sessions/SessionComparison';
import { KeywordTimeline } from '@/components/sessions/KeywordTimeline';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string, 10);

  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<CheckSessionWithStats[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [keywords, setKeywords] = useState<KeywordRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'fetch' | 'upload'>('sessions');

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
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<number[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Keyword timeline
  const [timelineKeyword, setTimelineKeyword] = useState<string | null>(null);

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

        // Select the latest session by default
        if (data.data.sessions && data.data.sessions.length > 0) {
          const latestSession = data.data.sessions[0];
          setSelectedSessionId(latestSession.id);
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch session keywords
  const fetchSessionKeywords = useCallback(async (sessionId: number) => {
    try {
      const response = await fetch(
        `/api/sessions/${sessionId}?brandDomain=${encodeURIComponent(brandDomain)}`
      );
      const data = await response.json();

      if (data.success) {
        setKeywords(data.data.keywords);
      }
    } catch (error) {
      console.error('Error fetching session keywords:', error);
    }
  }, [brandDomain]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionKeywords(selectedSessionId);
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
      // Refresh keywords with new brand rank calculation
      if (selectedSessionId) {
        fetchSessionKeywords(selectedSessionId);
      }
      setMessage({ type: 'success', text: 'Brand info updated' });
    } catch (error) {
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
        setActiveTab('sessions');
        setKeywordsInput('');
        setSessionName('');
        fetchProject(); // Refresh sessions list
        setSelectedSessionId(data.data.sessionId);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
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
        setActiveTab('sessions');
        setSessionName('');
        fetchProject(); // Refresh sessions list
        setSelectedSessionId(data.data.sessionId);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
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
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  // Handle comparison toggle
  const handleToggleComparison = (sessionId: number) => {
    setSelectedForComparison(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId);
      }
      return [...prev, sessionId];
    });
  };

  // Handle compare click
  const handleCompareClick = () => {
    if (comparisonMode && selectedForComparison.length >= 2) {
      setShowComparison(true);
    } else {
      setComparisonMode(!comparisonMode);
      if (!comparisonMode) {
        setSelectedForComparison([]);
      }
    }
  };

  // View keyword from comparison
  const handleViewKeywordFromComparison = (keyword: string, sessionId: number) => {
    setShowComparison(false);
    setComparisonMode(false);
    setSelectedSessionId(sessionId);
    // Could also scroll to or highlight the keyword
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-2 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Project not found</h2>
          <a href="/" className="text-blue-500 hover:underline mt-2 inline-block">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const aioCount = keywords.filter(k => k.hasAIOverview).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <a href="/" className="text-sm text-blue-500 hover:underline">
                &larr; Back to Projects
              </a>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{project.name}</h1>
            </div>
            <a
              href={`/project/${projectId}/dashboard`}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              View Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow border p-4">
            <div className="text-sm text-gray-500">Sessions</div>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow border p-4">
            <div className="text-sm text-gray-500">Keywords (Current)</div>
            <div className="text-2xl font-bold">{keywords.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow border p-4">
            <div className="text-sm text-gray-500">AI Overviews</div>
            <div className="text-2xl font-bold text-green-600">{aioCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow border p-4">
            <div className="text-sm text-gray-500">AIO Rate</div>
            <div className="text-2xl font-bold text-blue-600">
              {keywords.length > 0 ? ((aioCount / keywords.length) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>

        {/* Brand Configuration */}
        <div className="bg-white rounded-lg shadow border p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Brand Configuration</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Brand Name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., SEONGON"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Brand Domain</label>
              <input
                type="text"
                value={brandDomain}
                onChange={(e) => setBrandDomain(e.target.value)}
                placeholder="e.g., seongon.com"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={updateBrandInfo}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              Update
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Main content area */}
        <div className="flex gap-6">
          {/* Sessions sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow border p-4">
              {/* Tabs for sidebar */}
              <div className="flex gap-1 mb-4 border-b -mx-4 px-4">
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'sessions'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sessions
                </button>
                <button
                  onClick={() => setActiveTab('fetch')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'fetch'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  + Fetch
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'upload'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  + Upload
                </button>
              </div>

              {activeTab === 'sessions' && (
                <SessionList
                  sessions={sessions}
                  selectedSessionId={selectedSessionId}
                  onSelectSession={setSelectedSessionId}
                  onDeleteSession={handleDeleteSession}
                  onCompareClick={handleCompareClick}
                  comparisonMode={comparisonMode}
                  selectedForComparison={selectedForComparison}
                  onToggleComparison={handleToggleComparison}
                />
              )}

              {activeTab === 'fetch' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Session Name (optional)</label>
                    <input
                      type="text"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="e.g., December 2024 Check"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Keywords (one per line or comma-separated)
                    </label>
                    <textarea
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      placeholder="seo la gi&#10;marketing online&#10;ai trong seo"
                      rows={6}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Location</label>
                      <input
                        type="text"
                        value={locationCode}
                        onChange={(e) => setLocationCode(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Language</label>
                      <input
                        type="text"
                        value={languageCode}
                        onChange={(e) => setLanguageCode(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleFetch}
                    disabled={fetching}
                    className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    {fetching ? 'Fetching...' : 'Fetch Keywords'}
                  </button>
                </div>
              )}

              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Session Name (optional)</label>
                    <input
                      type="text"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="e.g., Imported Data - Dec 2024"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">JSON File</label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleUpload}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                  </div>
                  {uploading && (
                    <p className="text-sm text-gray-600">Uploading and processing...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Keywords table */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow border p-4">
              {selectedSession ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {selectedSession.name || `Session ${selectedSession.id}`}
                      </h3>
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
                    <div className="text-sm text-gray-500">
                      {keywords.length} keywords &middot; {aioCount} with AIO
                    </div>
                  </div>
                  {keywords.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>No keywords in this session.</p>
                    </div>
                  ) : (
                    <KeywordsTable
                      keywords={keywords}
                      brandDomain={brandDomain}
                      onKeywordClick={(keyword) => setTimelineKeyword(keyword)}
                    />
                  )}
                </>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-4">No sessions yet. Create your first check session to get started.</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setActiveTab('fetch')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Fetch Keywords
                    </button>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Upload JSON
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Select a session from the sidebar to view keywords.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Session Comparison Modal */}
      {showComparison && (
        <SessionComparison
          projectId={projectId}
          sessionIds={selectedForComparison}
          brandDomain={brandDomain}
          onClose={() => {
            setShowComparison(false);
            setComparisonMode(false);
            setSelectedForComparison([]);
          }}
          onViewKeyword={handleViewKeywordFromComparison}
        />
      )}

      {/* Keyword Timeline Modal */}
      {timelineKeyword && (
        <KeywordTimeline
          projectId={projectId}
          keyword={timelineKeyword}
          brandDomain={brandDomain}
          onClose={() => setTimelineKeyword(null)}
          onViewSession={(sessionId) => {
            setTimelineKeyword(null);
            setSelectedSessionId(sessionId);
          }}
        />
      )}
    </div>
  );
}
