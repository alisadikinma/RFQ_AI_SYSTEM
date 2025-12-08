'use client';

import { motion } from 'framer-motion';
import { User, Palette, Bell, Save } from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ThemeToggle } from '@/components/settings/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function SettingsPage() {
  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your account and preferences
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Profile
            </h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                  AS
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Ali Sadikin
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  ali@company.com
                </p>
                <p className="text-sm text-slate-500">
                  Engineer • Manufacturing
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  defaultValue="Ali Sadikin"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="ali@company.com"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                defaultValue="Engineering"
                placeholder="Enter your department"
              />
            </div>

            <div className="flex justify-end">
              <Button className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Appearance
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="mb-3 block">Theme</Label>
              <ThemeToggle />
            </div>

            <div>
              <Label className="mb-3 block">Table Density</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="density" className="text-primary-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Compact
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="density"
                    defaultChecked
                    className="text-primary-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Normal
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="density" className="text-primary-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Comfortable
                  </span>
                </label>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Notifications
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Email when RFQ is completed
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Receive notifications when your RFQ analysis is ready
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Weekly summary email
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Get a weekly digest of your RFQ activities
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Browser push notifications
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Receive real-time updates in your browser
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
