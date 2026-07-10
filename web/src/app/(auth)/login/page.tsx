'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from 'web/lib/supabase';
import { Sparkles, Mail, Lock, ShieldAlert, Chrome, Github, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Set default theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const root = window.document.documentElement;
    if (savedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setError(error.message);
      } else {
        navigate('/dashboard');
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
    } catch (e: any) {
      setError(e.message || 'OAuth authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas text-text-body px-4 py-12 relative overflow-hidden transition-colors duration-500">
      
      {/* Noise background */}
      <div className="noise-overlay" />

      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-primary/10 blur-[100px] rounded-full pointer-events-none -z-10 animate-pulse-glow" />

      <div className="w-full max-w-md rounded-2xl glass-card border border-card-border p-8 shadow-2xl relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-3 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-primary to-accent-purple flex items-center justify-center transition-all group-hover:scale-105 duration-300">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-wider uppercase text-text-primary">Dev Tracker</span>
          </Link>
          <h2 className="text-2xl font-bold text-text-primary">Sign In to Dashboard</h2>
          <p className="text-xs text-text-secondary mt-1">Enter your credentials to access your activity report</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm flex gap-3 items-start animate-scale-up">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-muted">
                <Mail size={16} />
              </span>
              <input
                type="email"
                {...register('email')}
                placeholder="developer@domain.com"
                className="w-full bg-card-bg/60 border border-border-default rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary placeholder-text-muted/60 focus:outline-none focus:border-accent-primary/50 transition-all"
              />
            </div>
            {errors.email && <span className="text-xs text-accent-red/90 mt-1 block">{errors.email.message}</span>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block">Password</label>
              <Link to="/forgot-password" className="text-xs font-medium text-accent-primary hover:text-accent-primary-hover transition">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-muted">
                <Lock size={16} />
              </span>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full bg-card-bg/60 border border-border-default rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary placeholder-text-muted/60 focus:outline-none focus:border-accent-primary/50 transition-all"
              />
            </div>
            {errors.password && <span className="text-xs text-accent-red/90 mt-1 block">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-accent-primary to-accent-primary-hover hover:from-accent-primary-hover hover:to-accent-primary disabled:opacity-65 text-white font-semibold text-sm py-3.5 rounded-xl shadow-lg shadow-accent-primary/10 active:scale-[0.99] transition duration-200 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-default" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-canvas px-3.5 text-text-muted font-medium transition-colors duration-500">Or continue with</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleOAuthLogin('google')}
            className="inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-border-default bg-card-bg hover:bg-card-hover-bg transition text-xs font-semibold text-text-secondary cursor-pointer"
          >
            <Chrome size={14} className="text-accent-red" />
            Google
          </button>
          <button
            onClick={() => handleOAuthLogin('github')}
            className="inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-border-default bg-card-bg hover:bg-card-hover-bg transition text-xs font-semibold text-text-secondary cursor-pointer"
          >
            <Github size={14} className="text-text-primary" />
            GitHub
          </button>
        </div>

        {/* Bottom Redirect */}
        <div className="text-center mt-8 text-xs text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-semibold text-accent-primary hover:text-accent-primary-hover transition">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
