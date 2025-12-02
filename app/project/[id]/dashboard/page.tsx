'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Project, AnalysisResult } from '@/lib/types';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { CompetitorTable } from '@/components/dashboard/CompetitorTable';
import { CompetitorChart } from '@/components/dashboard/CompetitorChart';

export default function DashboardPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string, 10);

  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandDomain, setBrandDomain] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch project
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();
        if (data.success) {
          setProject(data.data);
          setBrandName(data.data.brand_name || '');
          setBrandDomain(data.data.brand_domain || '');
        }
      } catch (err) {
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  // Run analysis
  const runAnalysis = useCallback(async () => {
    if (!brandName || !brandDomain) {
      setError('Please enter brand name and domain');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          brandName,
          brandDomain
        })
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to run analysis');
    } finally {
      setAnalyzing(false);
    }
  }, [projectId, brandName, brandDomain]);

  // Export CSV
  const exportCSV = async (type: 'keywords' | 'competitors') => {
    const url = `/api/analyze?projectId=${projectId}&brandName=${encodeURIComponent(brandName)}&brandDomain=${encodeURIComponent(brandDomain)}&format=csv&type=${type}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-2 text-gray-600">Loading...</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <a href={`/project/${projectId}`} className="text-sm text-blue-500 hover:underline">
                ← Back to Project
              </a>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">
                {project.name} - Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Analysis Config */}
        <div className="bg-white rounded-lg shadow border p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Analysis Configuration</h3>
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
              onClick={runAnalysis}
              disabled={analyzing}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              {analyzing ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
        </div>

        {/* Analysis Results */}
        {analysis ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <SummaryCards
              totalKeywords={analysis.summary.totalKeywords}
              aiOverviewsFound={analysis.summary.aiOverviewsFound}
              competitorsIdentified={analysis.summary.competitorsIdentified}
            />

            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => exportCSV('keywords')}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                Export Keywords CSV
              </button>
              <button
                onClick={() => exportCSV('competitors')}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                Export Competitors CSV
              </button>
            </div>

            {/* Chart */}
            {analysis.competitors.length > 0 && (
              <CompetitorChart
                competitors={analysis.competitors}
                brandName={brandName}
              />
            )}

            {/* Competitor Table */}
            {analysis.competitors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Competitor Analysis</h3>
                <CompetitorTable
                  competitors={analysis.competitors}
                  brandName={brandName}
                />
              </div>
            )}

            {/* Brand Performance Summary */}
            {(() => {
              const userBrand = analysis.competitors.find(
                c => c.brand.toLowerCase() === brandName.toLowerCase()
              );
              const userRank = analysis.competitors.findIndex(
                c => c.brand.toLowerCase() === brandName.toLowerCase()
              ) + 1;

              if (userBrand) {
                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                      Your Brand Performance: {brandName}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-yellow-700">Overall Rank</div>
                        <div className="text-2xl font-bold text-yellow-900">#{userRank}</div>
                        <div className="text-xs text-yellow-600">of {analysis.competitors.length}</div>
                      </div>
                      <div>
                        <div className="text-sm text-yellow-700">Citations</div>
                        <div className="text-2xl font-bold text-yellow-900">{userBrand.citedCount}</div>
                      </div>
                      <div>
                        <div className="text-sm text-yellow-700">Mentions</div>
                        <div className="text-2xl font-bold text-yellow-900">{userBrand.mentionedCount}</div>
                      </div>
                      <div>
                        <div className="text-sm text-yellow-700">Avg Citation Rank</div>
                        <div className="text-2xl font-bold text-yellow-900">
                          {userBrand.averageRank.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-yellow-700">Citation Rate:</span>{' '}
                        <span className="font-medium">{(userBrand.promptCitedRate * 100).toFixed(1)}%</span>
                        <span className="text-yellow-600 ml-1">
                          (cited in {userBrand.citedInPrompts} of {analysis.summary.aiOverviewsFound} AI Overviews)
                        </span>
                      </div>
                      <div>
                        <span className="text-yellow-700">Mention Rate:</span>{' '}
                        <span className="font-medium">{(userBrand.mentionRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analysis yet</h3>
            <p className="text-gray-600 mb-4">
              Enter your brand name and domain, then click "Run Analysis" to see competitor insights
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
