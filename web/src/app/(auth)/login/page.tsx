'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from 'web/lib/supabase';
import { Sparkles, Mail, Lock, ShieldAlert, Chrome, Github, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
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
      {/* Subtle background graphics */}
      <div className="noise-overlay" />
      <div className="absolute inset-0 mesh-grid pointer-events-none -z-10 opacity-40" />

      {/* Dynamic light sources */}
      <div className="absolute top-[20%] left-[30%] w-[350px] h-[350px] bg-accent-primary/10 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute bottom-[20%] right-[30%] w-[400px] h-[400px] bg-accent-purple/5 blur-[150px] rounded-full pointer-events-none -z-10 animate-pulse-glow" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md rounded-3xl border border-card-border bg-card-bg/60 backdrop-blur-2xl p-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10"
      >
        {/* Animated accent top border */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-accent-primary via-accent-purple to-accent-cyan rounded-t-3xl" />

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link to="/" className="flex items-center gap-3 mb-4 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-accent-primary to-accent-purple flex items-center justify-center transition-all group-hover:scale-105 duration-300 shadow-lg shadow-accent-primary/20">
              <Sparkles size={22} className="text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-wider uppercase text-text-primary font-sans">Dev Tracker</span>
          </Link>
          <h2 className="text-2xl font-bold font-serif text-text-primary tracking-tight">Welcome Back</h2>
          <p className="text-xs text-text-secondary mt-1.5 max-w-xs leading-relaxed">Sign in to resume tracking and view your developer analytics panel.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs flex gap-3 items-start"
          >
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Email Address</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted group-focus-within:text-accent-primary transition-colors">
                <Mail size={15} />
              </span>
              <input
                type="email"
                {...register('email')}
                placeholder="developer@domain.com"
                className="w-full bg-card-bg/40 border border-border-default hover:border-border-hover focus:border-accent-primary rounded-xl pl-11 pr-4 py-3 text-xs text-text-primary placeholder-text-muted/50 focus:outline-none transition-all duration-300"
              />
            </div>
            {errors.email && <span className="text-[10px] text-accent-red/90 font-medium block mt-1">{errors.email.message}</span>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Password</label>
              <Link to="/forgot-password" className="text-[10px] font-bold text-accent-primary hover:text-accent-primary-hover transition-colors">
                Forgot Password?
              </Link>
            </div>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted group-focus-within:text-accent-primary transition-colors">
                <Lock size={15} />
              </span>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full bg-card-bg/40 border border-border-default hover:border-border-hover focus:border-accent-primary rounded-xl pl-11 pr-4 py-3 text-xs text-text-primary placeholder-text-muted/50 focus:outline-none transition-all duration-300"
              />
            </div>
            {errors.password && <span className="text-[10px] text-accent-red/90 font-medium block mt-1">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-accent-primary to-accent-primary-hover hover:from-accent-primary-hover hover:to-accent-primary disabled:opacity-60 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-accent-primary/20 active:scale-[0.98] transition-all duration-300 cursor-pointer disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-default" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-[#0E1220] dark:bg-[#0E1220] px-3.5 text-text-muted transition-colors duration-500 rounded-md">Or authenticate with</span>
          </div>
        </div>

        {/* Social Authentication */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleOAuthLogin('google')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border-default bg-card-bg/60 hover:bg-card-hover-bg/80 text-xs font-semibold text-text-primary cursor-pointer active:scale-95 transition"
          >
            <Chrome size={14} className="text-accent-red" />
            <span>Google</span>
          </button>
          <button
            onClick={() => handleOAuthLogin('github')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border-default bg-card-bg/60 hover:bg-card-hover-bg/80 text-xs font-semibold text-text-primary cursor-pointer active:scale-95 transition"
          >
            <Github size={14} className="text-text-primary dark:text-white" />
            <span>GitHub</span>
          </button>
        </div>

        {/* Redirect */}
        <div className="text-center mt-8 text-xs text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-bold text-accent-primary hover:text-accent-primary-hover transition-colors">
            Create Free Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
