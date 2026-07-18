'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from 'web/lib/supabase';
import {
  ArrowRight,
  CheckCircle2,
  Github,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || '/dashboard';

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const root = window.document.documentElement;
    root.classList.toggle('dark', savedTheme === 'dark');
    root.classList.toggle('light', savedTheme !== 'dark');
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
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
        return;
      }

      navigate(nextPath, { replace: true });
    } catch (e: any) {
      setError(e.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'github') => {
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-canvas text-text-body px-4 py-8 flex items-center justify-center relative overflow-hidden">
      <div className="noise-overlay" />
      <div className="absolute inset-0 mesh-grid pointer-events-none opacity-60" />

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-[1fr_440px] gap-6 items-stretch">
        <section className="hidden lg:flex rounded-lg border border-border-default bg-card-bg p-8 flex-col justify-between min-h-[620px]">
          <Link to="/" className="inline-flex items-center gap-3 w-fit">
            <span className="w-9 h-9 rounded-lg bg-accent-primary text-white flex items-center justify-center">
              <Sparkles size={18} />
            </span>
            <span className="text-sm font-extrabold tracking-wider uppercase text-text-primary">Dev Tracker</span>
          </Link>

          <div className="space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-lg border border-accent-green/20 bg-accent-green/10 px-3 py-1.5 text-xs font-semibold text-accent-green">
              <CheckCircle2 size={14} />
              VS Code data stays local until you sync
            </div>
            <div>
              <h1 className="text-4xl font-bold text-text-primary leading-tight">Sign in to your analytics workspace.</h1>
              <p className="mt-3 text-sm text-text-secondary leading-6">
                Your dashboard account gives you one UUID. Paste that UUID into VS Code and your local extension can sync sessions to this Supabase profile.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ['1', 'Sign in'],
                ['2', 'Copy UUID'],
                ['3', 'Open dashboard'],
              ].map(([step, label]) => (
                <div key={step} className="rounded-lg border border-border-default bg-card-hover-bg/35 p-4">
                  <div className="text-[10px] font-bold text-text-muted uppercase">Step {step}</div>
                  <div className="mt-2 text-sm font-semibold text-text-primary">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border-default bg-canvas p-4 font-mono text-xs text-text-secondary">
            devTracker.userId = <span className="text-accent-primary">your-account-uuid</span>
          </div>
        </section>

        <section className="rounded-lg border border-border-default bg-card-bg p-6 sm:p-8 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.6)]">
          <div className="mb-8">
            <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-6">
              <span className="w-8 h-8 rounded-lg bg-accent-primary text-white flex items-center justify-center">
                <Sparkles size={16} />
              </span>
              <span className="text-sm font-extrabold tracking-wider uppercase text-text-primary">Dev Tracker</span>
            </Link>
            <h2 className="text-2xl font-bold text-text-primary">Sign in</h2>
            <p className="text-sm text-text-secondary mt-2">Dashboard access requires your Supabase account.</p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-accent-red/25 bg-accent-red/10 p-3 text-xs text-accent-red flex gap-2">
              <ShieldAlert size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Email</label>
              <div className="relative mt-1.5">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-border-default bg-canvas py-3 pl-10 pr-3 text-sm text-text-primary outline-none transition focus:border-accent-primary"
                />
              </div>
              {errors.email && <p className="mt-1 text-[11px] text-accent-red">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Password</label>
                <Link to="/forgot-password" className="text-[11px] font-bold text-accent-primary hover:text-accent-primary-hover">
                  Reset password
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="Password"
                  className="w-full rounded-lg border border-border-default bg-canvas py-3 pl-10 pr-3 text-sm text-text-primary outline-none transition focus:border-accent-primary"
                />
              </div>
              {errors.password && <p className="mt-1 text-[11px] text-accent-red">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-accent-primary px-4 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 transition hover:bg-accent-primary-hover disabled:opacity-60"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><span>Open dashboard</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <button
            type="button"
            onClick={() => handleOAuthLogin('github')}
            className="mt-4 w-full rounded-lg border border-border-default bg-card-hover-bg/30 px-4 py-3 text-sm font-semibold text-text-primary flex items-center justify-center gap-2 transition hover:bg-card-hover-bg"
          >
            <Github size={16} />
            Continue with GitHub
          </button>

          <div className="mt-6 rounded-lg border border-accent-primary/20 bg-accent-primary/10 p-4 flex gap-3">
            <KeyRound size={18} className="text-accent-primary shrink-0 mt-0.5" />
            <p className="text-xs leading-5 text-text-secondary">
              After login, go to Settings and copy only your UUID into VS Code. No Supabase service key is needed in the extension.
            </p>
          </div>

          <p className="mt-8 text-center text-sm text-text-secondary">
            New here?{' '}
            <Link to="/signup" className="font-bold text-accent-primary hover:text-accent-primary-hover">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
