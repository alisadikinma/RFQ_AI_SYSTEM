'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Cpu, FileText, Target, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageTransition } from '@/components/layout/PageTransition';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RFQTrendChart } from '@/components/dashboard/RFQTrendChart';
import { TopList } from '@/components/dashboard/TopList';
import { RecentRFQTable } from '@/components/dashboard/RecentRFQTable';
import { Button } from '@/components/ui/button';
import { getDashboardData, DashboardData } from '@/lib/api/dashboard';

const containerVariants = {
  animate: {
    transition: { staggerChildren: 0.1 }
  }
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getDashboardData();
        setData(result);
      } catch (error: any) {
        console.error('Dashboard error:', error);
        toast.error('Failed to load dashboard', {
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-9 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-5 w-64 bg-slate-200 dark:bg-slate-700 rounded mt-2 animate-pulse" />
            </div>
            <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border p-6 animate-pulse">
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
                <div className="h-10 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border p-6 animate-pulse">
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
            <div className="h-72 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border p-6 animate-pulse">
                <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
                <div className="space-y-3">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!data) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-slate-500">Failed to load dashboard data</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-slate-900 dark:text-white"
            >
              {getGreeting()}! ☀️
            </motion.h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Overview of your RFQ activities
            </p>
          </div>
          <Link href="/rfq/new">
            <Button className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 gap-2">
              <Plus className="w-4 h-4" />
              New RFQ
            </Button>
          </Link>
        </div>

        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <StatsCard
            title="Models"
            value={data.stats.models.value}
            icon={Package}
            trend={data.stats.models.trend}
            trendValue={data.stats.models.change}
            delay={0}
          />
          <StatsCard
            title="Machines"
            value={data.stats.machines.value}
            icon={Cpu}
            trend={data.stats.machines.trend}
            trendValue={data.stats.machines.change}
            delay={0.1}
          />
          <StatsCard
            title="This Month"
            value={data.stats.thisMonth.value}
            icon={FileText}
            trend={data.stats.thisMonth.trend}
            trendValue={data.stats.thisMonth.change}
            delay={0.2}
          />
          <StatsCard
            title="Avg Stations"
            value={data.stats.avgMatch.value}
            icon={Target}
            trend={data.stats.avgMatch.trend}
            trendValue={data.stats.avgMatch.change}
            delay={0.3}
          />
        </motion.div>

        <RFQTrendChart data={data.trends} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopList
            title="Top Models (by Stations)"
            icon="🏆"
            items={data.topModels}
            onViewAll={() => window.location.href = '/models'}
          />
          <TopList
            title="Top Customers"
            icon="👥"
            items={data.topCustomers}
          />
        </div>

        <RecentRFQTable rfqs={data.recentRFQs} />
      </div>
    </PageTransition>
  );
}
