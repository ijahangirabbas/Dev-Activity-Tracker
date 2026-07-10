'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { supabase } from 'web/lib/supabase';
import { Sparkles, Mail, ShieldAlert, Check, Loader2, ArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetErr) {
        setError(resetErr.message);
      } else {
        setSuccess(true);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] px-4 py-12 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-md rounded-2xl glass-card border-slate-800 p-8 shadow-2xl">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-3 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-wider uppercase text-slate-200">Dev Tracker</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-100">Reset Password</h2>
          <p className="text-xs text-slate-400 mt-1">Enter email to receive password recovery link</p>
        </div>

        {/* Success State */}
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-200">Check Your Inbox</h3>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              We sent a password recovery link. Check your email details and click it to set a new password.
            </p>
            <Link
              to="/login"
              className="mt-8 inline-flex items-center justify-center w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm rounded-xl text-white transition-all shadow-md shadow-indigo-600/15"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-3 items-start">
                <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="developer@domain.com"
                    className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>
                {errors.email && <span className="text-xs text-rose-500/90 mt-1 block">{errors.email.message}</span>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-650 text-white font-semibold text-sm py-3.5 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.99] transition duration-200 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>

            {/* Bottom Redirect */}
            <div className="text-center mt-8">
              <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition">
                <ArrowLeft size={12} />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
