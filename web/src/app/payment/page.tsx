'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, CreditCard, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

export default function PaymentPage() {
  const [email, setEmail] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !cardNumber) return;
    setStatus('processing');
    setTimeout(() => {
      setStatus('success');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#020205] text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden">
      {/* Noise background overlay */}
      <div className="noise-overlay" />
      <div className="absolute inset-0 mesh-grid pointer-events-none -z-10 opacity-45" />

      {/* Top Header */}
      <header className="px-6 py-5 border-b border-white/[0.04] bg-slate-950/20 backdrop-blur-md flex items-center justify-between z-10">
        <Link to="/" className="flex items-center gap-2.5 text-slate-400 hover:text-white transition-colors text-xs font-bold">
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="3"/></svg>
          </div>
          <span className="font-bold text-xs tracking-wider uppercase text-slate-200">Dev Tracker</span>
        </div>
      </header>

      {/* Main Form Space */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl border border-white/[0.06] bg-slate-950/60 shadow-2xl overflow-hidden min-h-[460px]">
          
          {/* Left panel: Product / Contribution Summary */}
          <div className="p-8 bg-slate-950/80 border-r border-white/[0.04] flex flex-col justify-between">
            <div className="space-y-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Secure Checkout</span>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Developer Contribution</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Support the open-source maintenance of Dev-Activity-Tracker. Thank you for contributing to our development toolkit!
                </p>
              </div>

              {/* Price Tag */}
              <div className="py-4 border-y border-white/[0.04] flex justify-between items-center">
                <span className="text-xs text-slate-400">One-time Support Tier</span>
                <span className="text-3xl font-mono font-extrabold text-white">$5.00</span>
              </div>
            </div>

            <div className="space-y-4 pt-6 md:pt-0">
              <div className="flex items-center gap-3 text-xs text-slate-450">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                <span>100% Encrypted SSL checkout pipeline</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-450">
                <Lock size={16} className="text-indigo-400 shrink-0" />
                <span>Transactions processed directly via Stripe</span>
              </div>
            </div>
          </div>

          {/* Right panel: Payment Checkout Form / Success Screen */}
          <div className="p-8 flex flex-col justify-center">
            {status !== 'success' ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Card Details</h3>
                
                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Billing Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 bg-black/40 border border-white/[0.06] hover:border-white/[0.1] focus:border-indigo-500 focus:outline-none rounded-xl text-xs text-white transition-all font-mono"
                  />
                </div>

                {/* Name on Card */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Name on Card</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-black/40 border border-white/[0.06] hover:border-white/[0.1] focus:border-indigo-500 focus:outline-none rounded-xl text-xs text-white transition-all"
                  />
                </div>

                {/* Card Number Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={19}
                      required
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      placeholder="•••• •••• •••• ••••"
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/[0.06] hover:border-white/[0.1] focus:border-indigo-500 focus:outline-none rounded-xl text-xs text-white transition-all font-mono"
                    />
                    <CreditCard size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>

                {/* Expiry & CVC Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Expiration</label>
                    <input
                      type="text"
                      maxLength={5}
                      required
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 bg-black/40 border border-white/[0.06] hover:border-white/[0.1] focus:border-indigo-500 focus:outline-none rounded-xl text-xs text-white transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">CVC</label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={cardCvc}
                      onChange={e => setCardCvc(e.target.value)}
                      placeholder="•••"
                      className="w-full px-4 py-3 bg-black/40 border border-white/[0.06] hover:border-white/[0.1] focus:border-indigo-500 focus:outline-none rounded-xl text-xs text-white transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Submit button with loader */}
                <button
                  type="submit"
                  disabled={status === 'processing'}
                  className="w-full py-4 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-200 active:scale-98 transition duration-300 shadow-xl shadow-white/5 cursor-pointer mt-4 flex items-center justify-center gap-2"
                >
                  {status === 'processing' ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="animate-spin h-3.5 w-3.5 text-slate-950" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                      Processing...
                    </span>
                  ) : (
                    <span>Pay $5.00</span>
                  )}
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5 flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-white">Payment Successful</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Thank you for contributing to Dev-Activity-Tracker. Your receipt has been sent to <span className="text-slate-200 font-bold font-mono">{email}</span>.
                </p>
                <Link
                  to="/"
                  className="mt-4 px-6 py-2.5 rounded-full border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.08] text-xs font-bold text-slate-350 hover:text-white transition duration-300"
                >
                  Return to Home
                </Link>
              </motion.div>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[10px] text-slate-600 border-t border-white/[0.03] z-10">
        &copy; {new Date().getFullYear()} Jeem Labs. Secure card processing provided by Stripe.
      </footer>
    </div>
  );
}
