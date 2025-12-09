'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import type { ExtractedStation } from '@/lib/excel-parser/types';

interface SimilarModel {
  modelName: string;
  customer: string;
  similarity: number;
  matchingStations: string[];
  totalStations: number;
}

export default function ComparisonPage() {
  const router = useRouter();
  const [stations, setStations] = useState<ExtractedStation[]>([]);
  const [similarModels, setSimilarModels] = useState<SimilarModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Load stations from session storage
  useEffect(() => {
    const storedStations = sessionStorage.getItem('rfq_stations');
    if (storedStations) {
      try {
        const parsed = JSON.parse(storedStations);
        setStations(parsed);
      } catch (e) {
        console.error('Failed to parse stations:', e);
      }
    }
    setLoading(false);
  }, []);

  // Search for similar models
  const handleSearch = async () => {
    if (stations.length === 0) return;

    setSearching(true);
    try {
      const stationCodes = stations.map((s) => s.name);
      const response = await fetch('/api/rfq/similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stations: stationCodes }),
      });

      const data = await response.json();
      if (data.success && data.results) {
        setSimilarModels(data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  // Auto-search on load
  useEffect(() => {
    if (stations.length > 0 && similarModels.length === 0 && !searching) {
      handleSearch();
    }
  }, [stations]);

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageTransition>
    );
  }

  if (stations.length === 0) {
    return (
      <PageTransition>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No stations found.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/rfq/new')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Model Comparison
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Find similar models based on your station list
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/rfq/new')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Input
          </Button>
        </div>

        {/* Your Stations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Stations ({stations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stations.map((s, i) => (
                <Badge key={i} variant="secondary" className="font-mono">
                  {s.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Similar Models */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Similar Models</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </CardHeader>
          <CardContent>
            {searching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">
                  Searching for similar models...
                </span>
              </div>
            ) : similarModels.length > 0 ? (
              <div className="space-y-4">
                {similarModels.map((model, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      // Navigate to model details
                      console.log('View model:', model);
                    }}
                  >
                    <div>
                      <p className="font-medium">{model.modelName}</p>
                      <p className="text-sm text-muted-foreground">
                        {model.customer}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          model.similarity >= 80
                            ? 'default'
                            : model.similarity >= 60
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {model.similarity}% match
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {model.matchingStations.length}/{model.totalStations}{' '}
                        stations
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No similar models found.</p>
                <p className="text-sm mt-1">
                  This appears to be a new configuration.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.push('/rfq/new')}>
            Modify Stations
          </Button>
          <Button onClick={() => router.push('/rfq')}>Create RFQ</Button>
        </div>
      </div>
    </PageTransition>
  );
}
