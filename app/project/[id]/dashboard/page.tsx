'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Project, AnalysisResult, CheckSessionWithStats } from '@/lib/types';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { CompetitorTable } from '@/components/dashboard/CompetitorTable';
import { CompetitorChart } from '@/components/dashboard/CompetitorChart';
import { MetricsTrends } from '@/components/dashboard/MetricsTrends';
import { InsightsPanel } from '@/components/dashboard/InsightsPanel';
import { KeywordPerformanceGrid } from '@/components/dashboard/KeywordPerformanceGrid';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, BarChart3, Download, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

interface SessionMetrics {
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
}

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
  const [sessions, setSessions] = useState<CheckSessionWithStats[]>([]);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics[]>([]);

  // Fetch project and trends data
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

  // Fetch trends data when brand domain is available
  useEffect(() => {
    const fetchTrends = async () => {
      if (!brandDomain) return;
      try {
        const response = await fetch(
          `/api/analyze/trends?projectId=${projectId}&brandDomain=${encodeURIComponent(brandDomain)}&limit=10`
        );
        const data = await response.json();
        if (data.success) {
          setSessions(data.data.sessions);
          setSessionMetrics(data.data.metrics);
        }
      } catch (err) {
        console.error('Error fetching trends:', err);
      }
    };
    fetchTrends();
  }, [projectId, brandDomain]);

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
    } catch {
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
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-[400px] text-center">
          <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-300" />
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

  return (
    <div className="min-h-screen bg-gray-50/30">
      <Sidebar currentProjectId={projectId} />

      {/* Main Content */}
      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex h-16 items-center px-8">
            <div>
              <Link href={`/project/${projectId}`} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                <ArrowLeft className="h-4 w-4" />
                Back to Project
              </Link>
              <h1 className="text-lg font-semibold text-gray-900 mt-0.5">
                {project.name} - Dashboard
              </h1>
            </div>
          </div>
        </header>

        <main className="p-8 max-w-6xl mx-auto">
          {/* Analysis Config */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Analysis Configuration</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-700">Brand Name</label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g., SEONGON"
                  className="h-11 rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-700">Brand Domain</label>
                <Input
                  value={brandDomain}
                  onChange={(e) => setBrandDomain(e.target.value)}
                  placeholder="e.g., seongon.com"
                  className="h-11 rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                />
              </div>
              <Button
                onClick={runAnalysis}
                disabled={analyzing}
                className="h-11 rounded-xl bg-gray-900 hover:bg-gray-800 px-6"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Run Analysis
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
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
              <div className="flex gap-3">
                <Button
                  onClick={() => exportCSV('keywords')}
                  variant="outline"
                  className="rounded-xl border-gray-200"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Keywords CSV
                </Button>
                <Button
                  onClick={() => exportCSV('competitors')}
                  variant="outline"
                  className="rounded-xl border-gray-200"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Competitors CSV
                </Button>
              </div>

              {/* Brand Performance Summary - moved up for visibility */}
              {(() => {
                const userBrand = analysis.competitors.find(
                  c => c.brand.toLowerCase() === brandName.toLowerCase()
                );
                const userRank = analysis.competitors.findIndex(
                  c => c.brand.toLowerCase() === brandName.toLowerCase()
                ) + 1;

                if (userBrand) {
                  return (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                        <h3 className="text-lg font-semibold text-white">
                          Your Brand Performance: {brandName}
                        </h3>
                      </div>
                      <div className="p-6 bg-gradient-to-b from-indigo-50/30 to-white">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="text-center p-4 rounded-xl bg-white shadow-sm border border-gray-100">
                            <div className="text-4xl font-bold text-indigo-600">#{userRank}</div>
                            <div className="text-sm text-gray-500 mt-1">Overall Rank</div>
                            <div className="text-xs text-gray-400">of {analysis.competitors.length}</div>
                          </div>
                          <div className="text-center p-4 rounded-xl bg-white shadow-sm border border-gray-100">
                            <div className="text-4xl font-bold text-blue-600">{userBrand.citedCount}</div>
                            <div className="text-sm text-gray-500 mt-1">Citations</div>
                          </div>
                          <div className="text-center p-4 rounded-xl bg-white shadow-sm border border-gray-100">
                            <div className="text-4xl font-bold text-purple-600">{userBrand.mentionedCount}</div>
                            <div className="text-sm text-gray-500 mt-1">Mentions</div>
                          </div>
                          <div className="text-center p-4 rounded-xl bg-white shadow-sm border border-gray-100">
                            <div className="text-4xl font-bold text-emerald-600">
                              {userBrand.averageRank.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">Avg Citation Rank</div>
                          </div>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                          <div className="p-3 rounded-xl bg-gray-50">
                            <span className="text-gray-500">Citation Rate:</span>{' '}
                            <span className="font-semibold text-gray-900">{(userBrand.promptCitedRate * 100).toFixed(1)}%</span>
                            <span className="text-gray-400 ml-1">
                              (cited in {userBrand.citedInPrompts} of {analysis.summary.aiOverviewsFound} AI Overviews)
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-gray-50">
                            <span className="text-gray-500">Mention Rate:</span>{' '}
                            <span className="font-semibold text-gray-900">{(userBrand.mentionRate * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Chart */}
              {analysis.competitors.length > 0 && (
                <CompetitorChart
                  competitors={analysis.competitors}
                  brandName={brandName}
                />
              )}

              {/* AI-Powered Insights */}
              {analysis.competitors.length > 0 && (
                <InsightsPanel
                  competitors={analysis.competitors}
                  brandName={brandName}
                  totalAIOs={analysis.summary.aiOverviewsFound}
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

              {/* Competitor Table */}
              {analysis.competitors.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitor Analysis</h3>
                  <CompetitorTable
                    competitors={analysis.competitors}
                    brandName={brandName}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
              <div className="h-20 w-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No analysis yet</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Enter your brand name and domain, then click &quot;Run Analysis&quot; to see competitor insights
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
