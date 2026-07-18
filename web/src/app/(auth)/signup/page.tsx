'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from 'web/lib/supabase';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

const signupSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
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

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const root = window.document.documentElement;
    root.classList.toggle('dark', savedTheme === 'dark');
    root.classList.toggle('light', savedTheme !== 'dark');
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
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
        return;
      }

      if (authData.session) {
        navigate('/dashboard', { replace: true });
      } else {
        setSuccess(true);
      }
    } catch (e: any) {
      setError(e.message || 'Account creation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-text-body px-4 py-8 flex items-center justify-center relative overflow-hidden">
      <div className="noise-overlay" />
      <div className="absolute inset-0 mesh-grid pointer-events-none opacity-60" />

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-[1fr_440px] gap-6 items-stretch">
        <section className="hidden lg:flex rounded-lg border border-border-default bg-card-bg p-8 flex-col justify-between min-h-[660px]">
          <Link to="/" className="inline-flex items-center gap-3 w-fit">
            <span className="w-9 h-9 rounded-lg bg-accent-primary text-white flex items-center justify-center">
              <Sparkles size={18} />
            </span>
            <span className="text-sm font-extrabold tracking-wider uppercase text-text-primary">Dev Tracker</span>
          </Link>

          <div className="space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-lg border border-accent-primary/20 bg-accent-primary/10 px-3 py-1.5 text-xs font-semibold text-accent-primary">
              <KeyRound size={14} />
              One UUID connects VS Code to cloud analytics
            </div>
            <div>
              <h1 className="text-4xl font-bold text-text-primary leading-tight">Create your cloud dashboard account.</h1>
              <p className="mt-3 text-sm text-text-secondary leading-6">
                Your extension keeps tracking locally. This account gives you a private dashboard UUID for optional Supabase sync and web analytics.
              </p>
            </div>
            <div className="space-y-3">
              {[
                'No Supabase service key in VS Code',
                'Offline VS Code dashboard remains available',
                'Cloud dashboard requires sign-in',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-text-primary">
                  <CheckCircle2 size={16} className="text-accent-green" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border-default bg-canvas p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Setup after signup</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-text-secondary">
              <span>Sign in</span>
              <span>Copy UUID</span>
              <span>Paste in VS Code</span>
            </div>
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
            <h2 className="text-2xl font-bold text-text-primary">Create account</h2>
            <p className="text-sm text-text-secondary mt-2">Use this account to access the hosted dashboard.</p>
          </div>

          {success ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg border border-accent-green/25 bg-accent-green/10 text-accent-green">
                <Check size={26} />
              </div>
              <h3 className="text-xl font-bold text-text-primary">Check your email</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-text-secondary">
                Confirm your email, then sign in and copy your UUID from dashboard settings.
              </p>
              <Link
                to="/signin"
                className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-accent-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-accent-primary-hover"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
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
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Password</label>
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

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Confirm password</label>
                  <div className="relative mt-1.5">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="password"
                      {...register('confirmPassword')}
                      placeholder="Confirm password"
                      className="w-full rounded-lg border border-border-default bg-canvas py-3 pl-10 pr-3 text-sm text-text-primary outline-none transition focus:border-accent-primary"
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-[11px] text-accent-red">{errors.confirmPassword.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-accent-primary px-4 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 transition hover:bg-accent-primary-hover disabled:opacity-60"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><span>Create account</span><ArrowRight size={16} /></>}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-text-secondary">
                Already have an account?{' '}
                <Link to="/signin" className="font-bold text-accent-primary hover:text-accent-primary-hover">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
