import axios from 'axios';
import { supabase } from './supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const apiClient = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseAnonKey,
  },
});

apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  
  if (session) {
    config.headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
