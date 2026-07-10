'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from 'web/lib/supabase';
import { Sparkles, Mail, Lock, ShieldAlert, Check, Loader2 } from 'lucide-react';

const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupInput = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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

  const { register, handleSubmit, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: authData, error: signupErr } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signupErr) {
        setError(signupErr.message);
      } else {
        if (authData.session) {
          navigate('/dashboard');
        } else {
          setSuccess(true);
        }
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas text-text-body px-4 py-12 relative overflow-hidden transition-colors duration-500">
      
      {/* Noise background */}
      <div className="noise-overlay" />

      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-primary/10 blur-[100px] rounded-full pointer-events-none -z-10 animate-pulse-glow" />

      <div className="w-full max-w-md rounded-2xl glass-card border border-card-border p-8 shadow-2xl relative z-10 animate-scale-up">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-3 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-primary to-accent-purple flex items-center justify-center transition-all group-hover:scale-105 duration-300">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-wider uppercase text-text-primary">Dev Tracker</span>
          </Link>
          <h2 className="text-2xl font-bold text-text-primary">Create Web Account</h2>
          <p className="text-xs text-text-secondary mt-1">Unlock cloud dashboard sync and rolling backups</p>
        </div>

        {/* Success State */}
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-accent-green/10 border border-accent-green/20 text-accent-green rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={28} />
            </div>
            <h3 className="text-xl font-bold text-text-primary">Verify Your Email</h3>
            <p className="text-sm text-text-secondary mt-3 leading-relaxed">
              We sent a verification link to your email address. Please click it to complete registration.
            </p>
            <Link
              to="/login"
              className="mt-8 inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-accent-primary to-accent-primary-hover hover:from-accent-primary-hover hover:to-accent-primary font-semibold text-sm rounded-xl text-white transition-all shadow-md shadow-accent-primary/15"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <>
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
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Password</label>
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

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Confirm Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-muted">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    {...register('confirmPassword')}
                    placeholder="••••••••"
                    className="w-full bg-card-bg/60 border border-border-default rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary placeholder-text-muted/60 focus:outline-none focus:border-accent-primary/50 transition-all"
                  />
                </div>
                {errors.confirmPassword && <span className="text-xs text-accent-red/90 mt-1 block">{errors.confirmPassword.message}</span>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-accent-primary to-accent-primary-hover hover:from-accent-primary-hover hover:to-accent-primary disabled:opacity-65 text-white font-semibold text-sm py-3.5 rounded-xl shadow-lg shadow-accent-primary/10 active:scale-[0.99] transition duration-200 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Create Account'}
              </button>
            </form>

            {/* Bottom Redirect */}
            <div className="text-center mt-8 text-xs text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-accent-primary hover:text-accent-primary-hover transition">
                Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
