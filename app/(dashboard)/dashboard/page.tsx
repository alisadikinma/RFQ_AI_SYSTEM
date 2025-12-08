'use client';

import { motion } from 'framer-motion';
import { Package, Cpu, FileText, Target, Plus } from 'lucide-react';
import Link from 'next/link';
import { PageTransition } from '@/components/layout/PageTransition';
import { StatsCard as NewStatsCard } from '@/components/dashboard/StatsCard';
import { RFQTrendChart } from '@/components/dashboard/RFQTrendChart';
import { TopList } from '@/components/dashboard/TopList';
import { RecentRFQTable } from '@/components/dashboard/RecentRFQTable';
import { Button } from '@/components/ui/button';
import { mockDashboardData } from '@/lib/data/mock-dashboard';

const containerVariants = {
  animate: {
    transition: { staggerChildren: 0.1 }
  }
};

export default function DashboardPage() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
          <NewStatsCard
            title="Models"
            value={mockDashboardData.stats.models.value}
            icon={Package}
            trend={mockDashboardData.stats.models.trend}
            trendValue={mockDashboardData.stats.models.change}
            delay={0}
          />
          <NewStatsCard
            title="Machines"
            value={mockDashboardData.stats.machines.value}
            icon={Cpu}
            trend={mockDashboardData.stats.machines.trend}
            trendValue={mockDashboardData.stats.machines.change}
            delay={0.1}
          />
          <NewStatsCard
            title="This Month"
            value={mockDashboardData.stats.thisMonth.value}
            icon={FileText}
            trend={mockDashboardData.stats.thisMonth.trend}
            trendValue={mockDashboardData.stats.thisMonth.change}
            delay={0.2}
          />
          <NewStatsCard
            title="Avg Match"
            value={mockDashboardData.stats.avgMatch.value}
            suffix="%"
            icon={Target}
            trend={mockDashboardData.stats.avgMatch.trend}
            trendValue={mockDashboardData.stats.avgMatch.change}
            delay={0.3}
          />
        </motion.div>

        <RFQTrendChart data={mockDashboardData.trends} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopList
            title="Top Matched Models"
            icon="🏆"
            items={mockDashboardData.topModels}
            onViewAll={() => window.location.href = '/models'}
          />
          <TopList
            title="Top Customers"
            icon="👥"
            items={mockDashboardData.topCustomers}
          />
        </div>

        <RecentRFQTable rfqs={mockDashboardData.recentRFQs} />
      </div>
    </PageTransition>
  );
}
