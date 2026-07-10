import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from 'web/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      } else {
        const timeout = setTimeout(() => {
          navigate('/login');
        }, 3000);
        return () => clearTimeout(timeout);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-slate-100">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={36} className="animate-spin text-indigo-500" />
        <p className="text-sm text-slate-400 font-medium">Finalizing secure authentication...</p>
      </div>
    </div>
  );
}
