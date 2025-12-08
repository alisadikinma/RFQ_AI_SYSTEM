'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ResultsHeader } from '@/components/rfq/results/ResultsHeader';
import { RecommendationCard } from '@/components/rfq/results/RecommendationCard';
import { mockRecommendations } from '@/lib/data/mock-recommendations';

export default function ResultsPage() {
  const params = useParams();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (mockRecommendations[0]?.similarity_score > 90) {
      setTimeout(async () => {
        setShowConfetti(true);
        if (typeof window !== 'undefined') {
          const confetti = (await import('canvas-confetti')).default;
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#f59e0b']
          });
        }
      }, 1500);
    }
  }, []);

  const containerVariants = {
    animate: {
      transition: { staggerChildren: 0.15 }
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <ResultsHeader
          rfqId="RFQ-2024-001234"
          customer="XIAOMI"
          modelName="POCO-X7-MAIN"
          submittedAt="Dec 8, 2024 at 10:30 AM"
          processedIn={28}
          stationCount={8}
          boardTypeCount={2}
          targetUph={200}
        />

        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary-600" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Top Recommendations
          </h3>
        </div>

        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-6"
        >
          <RecommendationCard
            recommendation={mockRecommendations[0]}
            rank={1}
            delay={0}
            rfqId={params.id as string}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockRecommendations.slice(1).map((rec, index) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                rank={index + 2}
                delay={(index + 1) * 0.15}
                rfqId={params.id as string}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 text-center"
        >
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Click on any recommendation to view detailed analysis, station matching, and investment breakdown
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
}
