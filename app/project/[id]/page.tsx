'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Project, KeywordRow, KeywordRecord, Reference } from '@/lib/types';
import { KeywordsTable } from '@/components/KeywordsTable';

export default function ProjectPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string, 10);

  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<KeywordRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'keywords' | 'fetch' | 'upload'>('keywords');

  // Form states
  const [brandName, setBrandName] = useState('');
  const [brandDomain, setBrandDomain] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [locationCode, setLocationCode] = useState('2704');
  const [languageCode, setLanguageCode] = useState('vi');
  const [fetching, setFetching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch project data
  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.data);
        setBrandName(data.data.brand_name || '');
        setBrandDomain(data.data.brand_domain || '');

        // Convert KeywordRows to KeywordRecords
        const keywordRecords: KeywordRecord[] = data.data.keywords.map((kw: KeywordRow) => {
          const refs: Reference[] = kw.aio_references
            ? JSON.parse(kw.aio_references).map((r: { domain?: string; source?: string; url?: string }, idx: number) => ({
                rank: idx + 1,
                domain: r.domain || '',
                source: r.source || '',
                url: r.url || ''
              }))
            : [];

          // Find brand rank
          const brandRef = refs.find(r =>
            (data.data.brand_domain && r.domain.toLowerCase().includes(data.data.brand_domain.toLowerCase())) ||
            (data.data.brand_name && r.source.toLowerCase().includes(data.data.brand_name.toLowerCase()))
          );

          return {
            id: kw.id,
            keyword: kw.keyword,
            hasAIOverview: kw.has_ai_overview === 1,
            aioMarkdown: kw.aio_markdown,
            references: refs,
            referenceCount: refs.length,
            brandRank: brandRef?.rank || null
          };
        });

        setKeywords(keywordRecords);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Update brand info
  const updateBrandInfo = async () => {
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName, brandDomain })
      });
      fetchProject(); // Refresh to recalculate brand ranks
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
          languageCode
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Fetched ${data.data.savedCount} keywords (${data.data.errorCount} errors)`
        });
        setActiveTab('keywords');
        fetchProject();
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

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: `Uploaded ${data.data.savedCount} keywords` });
        setActiveTab('keywords');
        fetchProject();
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

  const aioCount = keywords.filter(k => k.hasAIOverview).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <a href="/" className="text-sm text-blue-500 hover:underline">
                ← Back to Projects
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
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow border p-4">
            <div className="text-sm text-gray-500">Total Keywords</div>
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('keywords')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'keywords'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Keywords ({keywords.length})
          </button>
          <button
            onClick={() => setActiveTab('fetch')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'fetch'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Fetch Keywords
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'upload'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upload JSON
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'keywords' && (
          <div className="bg-white rounded-lg shadow border p-4">
            {keywords.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">No keywords yet. Fetch keywords or upload a JSON file to get started.</p>
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
              <KeywordsTable keywords={keywords} brandDomain={brandDomain} />
            )}
          </div>
        )}

        {activeTab === 'fetch' && (
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="font-medium text-gray-900 mb-4">Fetch Keywords from DataForSEO</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Keywords (one per line or comma-separated)
                </label>
                <textarea
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="seo là gì&#10;marketing online&#10;ai trong seo"
                  rows={6}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Location Code</label>
                  <input
                    type="text"
                    value={locationCode}
                    onChange={(e) => setLocationCode(e.target.value)}
                    placeholder="2704"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Vietnam: 2704, US: 2840, UK: 2826</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Language Code</label>
                  <input
                    type="text"
                    value={languageCode}
                    onChange={(e) => setLanguageCode(e.target.value)}
                    placeholder="vi"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">vi, en, etc.</p>
                </div>
              </div>
              <button
                onClick={handleFetch}
                disabled={fetching}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {fetching ? 'Fetching...' : 'Fetch Keywords'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="font-medium text-gray-900 mb-4">Upload JSON File</h3>
            <p className="text-gray-600 mb-4">
              Upload a JSON file containing DataForSEO API results
            </p>
            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={handleUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
            </label>
            {uploading && (
              <p className="mt-2 text-gray-600">Uploading and processing...</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
