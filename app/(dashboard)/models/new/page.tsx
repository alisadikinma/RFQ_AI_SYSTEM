'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { scaleInVariants } from '@/lib/animations';

export default function NewModelPage() {
  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <motion.div
          variants={scaleInVariants}
          initial="initial"
          animate="animate"
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Plus className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Create New Model
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md">
            The multi-step model creation form is coming in Phase 3. You can view existing models on the Models page.
          </p>
          <div className="pt-4">
            <span className="inline-block px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-medium">
              Coming in Phase 3
            </span>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
