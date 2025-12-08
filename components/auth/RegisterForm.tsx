'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { signUp } from '@/lib/supabase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { shakeVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
    { label: 'Contains uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
    { label: 'Contains number', test: (pw: string) => /\d/.test(pw) },
  ];

  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      setError(true);
      setIsLoading(false);
      return;
    }

    if (!acceptTerms) {
      toast.error('Please accept the terms and conditions');
      setError(true);
      setIsLoading(false);
      return;
    }

    try {
      await signUp({ email, password, fullName });
      toast.success('Account created successfully');
      router.push('/dashboard');
    } catch (err: any) {
      setError(true);
      toast.error(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      animate={error ? 'shake' : ''}
      variants={shakeVariants}
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          disabled={isLoading}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {password && (
          <div className="space-y-1 mt-2">
            {passwordRequirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                {req.test(password) ? (
                  <Check className="w-3 h-3 text-success" />
                ) : (
                  <X className="w-3 h-3 text-slate-400" />
                )}
                <span
                  className={cn(
                    req.test(password)
                      ? 'text-success'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {confirmPassword && (
          <div className="flex items-center gap-2 text-xs">
            {passwordsMatch ? (
              <>
                <Check className="w-3 h-3 text-success" />
                <span className="text-success">Passwords match</span>
              </>
            ) : (
              <>
                <X className="w-3 h-3 text-error" />
                <span className="text-error">Passwords do not match</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="terms"
          checked={acceptTerms}
          onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
        />
        <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
          I accept the{' '}
          <Link href="/terms" className="text-primary-600 hover:text-primary-700">
            terms and conditions
          </Link>
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Sign in →
        </Link>
      </p>
    </motion.form>
  );
}
