'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Target, RefreshCw, ArrowLeft, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

interface MatchedStation {
  rfq_code: string;
  master_code: string;
  sequence: number;
}

interface RiskFactor {
  category: string;
  description: string;
  score: number;
  mitigation?: string;
}

interface RFQResult {
  id: string;
  matched_model_id: string;
  similarity_score: number;
  matched_stations: MatchedStation[];
  missing_stations: string[];
  inferred_stations: Array<{ code: string; reason: string }> | null;
  investment_breakdown: {
    total_investment_usd: number;
    effective_uph: number;
    total_manpower: number;
    line_utilization_percent: number;
    bottleneck_station: string;
    monthly_labor_cost_usd: number;
    total_fixture_cost_usd: number;
  } | null;
  cost_per_unit: { total: number } | null;
  risk_assessment: {
    risk_score: number;
    overall_level: 'low' | 'medium' | 'high';
    risk_factors: RiskFactor[];
    recommendations: string[];
  } | null;
  recommendation: {
    explanation?: {
      summary: string;
      similarity_explanation: string;
      station_analysis: string;
      risk_summary: string;
      recommendations: string[];
    };
    suggestions?: Array<{
      category: string;
      title: string;
      description: string;
      impact: string;
      action: string;
    }>;
    go_no_go: string;
  } | null;
  matched_model?: {
    code: string;
    name: string;
    customer: { code: string; name: string };
  };
}

interface RFQData {
  id: string;
  model_name: string;
  status: string;
  target_uph: number;
  target_volume: number;
  created_at: string;
  customer?: { code: string; name: string };
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [rfq, setRfq] = useState<RFQData | null>(null);
  const [results, setResults] = useState<RFQResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadResults();
  }, [params.id]);

  const loadResults = async () => {
    try {
      setIsLoading(true);

      // Fetch RFQ data
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfq_requests')
        .select(`*, customer:customers(code, name)`)
        .eq('id', params.id)
        .single();

      if (rfqError) throw rfqError;
      setRfq(rfqData);

      // Fetch results
      const { data: resultsData, error: resultsError } = await supabase
        .from('rfq_results')
        .select(`
          *,
          matched_model:models(code, name, customer:customers(code, name))
        `)
        .eq('rfq_id', params.id)
        .order('similarity_score', { ascending: false });

      if (resultsError) throw resultsError;
      setResults(resultsData || []);

      // Trigger confetti for high match
      if (resultsData && resultsData[0]?.similarity_score > 90) {
        setTimeout(async () => {
          if (typeof window !== 'undefined') {
            const confetti = (await import('canvas-confetti')).default;
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#3b82f6', '#10b981', '#f59e0b']
            });
          }
        }, 500);
      }
    } catch (error) {
      console.error('Failed to load results:', error);
      toast.error('Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReprocess = async () => {
    try {
      setIsProcessing(true);
      toast.loading('Processing RFQ...', { id: 'process' });

      const response = await fetch(`/api/rfq/${params.id}/process`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      toast.success('Processing complete!', { id: 'process' });
      loadResults();
    } catch (error) {
      toast.error('Processing failed', {
        id: 'process',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <LoadingSkeleton className="h-12 w-1/3" />
          <LoadingSkeleton className="h-48 w-full" />
          <LoadingSkeleton className="h-32 w-full" />
          <LoadingSkeleton className="h-32 w-full" />
        </div>
      </PageTransition>
    );
  }

  const topResult = results[0];
  const explanation = topResult?.recommendation?.explanation;
  const suggestions = topResult?.recommendation?.suggestions;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/rfq">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl font-bold">{rfq?.model_name || 'RFQ Results'}</h1>
            <p className="text-muted-foreground">
              {rfq?.customer?.name || 'Unknown Customer'} | Target: {rfq?.target_uph} UPH, {rfq?.target_volume?.toLocaleString()} units/month
            </p>
          </div>
          <div className="flex items-center gap-3">
            {topResult?.recommendation?.go_no_go && (
              <Badge
                variant={topResult.recommendation.go_no_go === 'Proceed' ? 'default' : 'destructive'}
                className="text-sm px-3 py-1"
              >
                {topResult.recommendation.go_no_go === 'Proceed' ? (
                  <CheckCircle className="w-4 h-4 mr-1" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-1" />
                )}
                {topResult.recommendation.go_no_go}
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={handleReprocess}
              disabled={isProcessing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
              Re-process
            </Button>
          </div>
        </div>

        {/* No Results */}
        {results.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
              <p className="text-muted-foreground mb-4">
                This RFQ hasn&apos;t been processed yet or no matches were found.
              </p>
              <Button onClick={handleReprocess} disabled={isProcessing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                Process Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* AI Summary (LLM Generated) */}
        {explanation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">📋</span> Ringkasan AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">{explanation.summary}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Analisis Similarity</h4>
                    <p className="text-sm text-muted-foreground">{explanation.similarity_explanation}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Analisis Station</h4>
                    <p className="text-sm text-muted-foreground">{explanation.station_analysis}</p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Risiko</h4>
                  <p className="text-sm text-muted-foreground">{explanation.risk_summary}</p>
                </div>

                {explanation.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Rekomendasi</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {explanation.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Similarity Results */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Model Serupa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.map((result, idx) => (
                    <Link
                      key={result.id}
                      href={`/rfq/${params.id}/results/${result.matched_model_id}`}
                    >
                      <div className={`flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors ${idx === 0 ? 'border-primary bg-primary/5' : ''}`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-medium">{result.matched_model?.code || 'Unknown'}</span>
                            <span className="text-muted-foreground ml-2">
                              ({result.matched_model?.customer?.code || 'N/A'})
                            </span>
                            {idx === 0 && (
                              <Badge variant="outline" className="ml-2 text-xs">Best Match</Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant={result.similarity_score >= 85 ? 'default' : result.similarity_score >= 70 ? 'secondary' : 'outline'}>
                          {Math.round(result.similarity_score)}% Match
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Cost Summary */}
        {topResult?.investment_breakdown && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">💰</span> Estimasi Biaya
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total Investment</p>
                    <p className="text-2xl font-bold">
                      ${topResult.investment_breakdown.total_investment_usd?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Cost/Unit</p>
                    <p className="text-2xl font-bold">
                      ${topResult.cost_per_unit?.total?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Effective UPH</p>
                    <p className="text-2xl font-bold">{topResult.investment_breakdown.effective_uph}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total Manpower</p>
                    <p className="text-2xl font-bold">{topResult.investment_breakdown.total_manpower}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Monthly Labor:</span>
                    <span className="ml-2 font-medium">${topResult.investment_breakdown.monthly_labor_cost_usd?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fixture Cost:</span>
                    <span className="ml-2 font-medium">${topResult.investment_breakdown.total_fixture_cost_usd?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Line Utilization:</span>
                    <span className="ml-2 font-medium">{topResult.investment_breakdown.line_utilization_percent}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bottleneck:</span>
                    <span className="ml-2 font-medium">{topResult.investment_breakdown.bottleneck_station}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AI Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">💡</span> Saran AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suggestions.map((sug, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{sug.category}</Badge>
                        <Badge variant={sug.impact === 'high' ? 'destructive' : sug.impact === 'medium' ? 'secondary' : 'outline'}>
                          {sug.impact} impact
                        </Badge>
                      </div>
                      <h4 className="font-medium">{sug.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{sug.description}</p>
                      <p className="text-sm font-medium mt-2 text-primary">Action: {sug.action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Risk Assessment */}
        {topResult?.risk_assessment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl font-bold">
                    {topResult.risk_assessment.risk_score}/5
                  </div>
                  <Badge variant={
                    topResult.risk_assessment.overall_level === 'high' ? 'destructive' :
                    topResult.risk_assessment.overall_level === 'medium' ? 'secondary' : 'default'
                  }>
                    {topResult.risk_assessment.overall_level.toUpperCase()} RISK
                  </Badge>
                </div>
                <div className="space-y-2">
                  {topResult.risk_assessment.risk_factors?.map((factor, idx) => (
                    <div key={idx} className="flex justify-between items-start p-2 bg-muted/50 rounded">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{factor.category}:</span>
                        <span className="text-sm text-muted-foreground ml-2">{factor.description}</span>
                        {factor.mitigation && (
                          <p className="text-xs text-primary mt-1">Mitigation: {factor.mitigation}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2">{factor.score}/5</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
