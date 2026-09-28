import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Disc3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n/LanguageContext';
import { BrandName } from '../components/BrandName';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setInfo('');
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setSubmitting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setInfo(t('login.forgotSent'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <Disc3 className="w-10 h-10 text-emerald-400" />
            <BrandName className="text-lg" />
          </Link>
          <h1 className="text-xl font-bold">{mode === 'forgot' ? t('login.forgotTitle') : t('login.title')}</h1>
          <p className="text-xs text-zinc-400">
            {mode === 'forgot' ? t('login.forgotBody') : t('login.subtitle')}
          </p>
        </div>

        {mode === 'forgot' ? (
          <form onSubmit={handleForgot} className="space-y-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            {error && (
              <div className="text-xs text-red-300 bg-red-950/60 border border-red-900 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            {info && (
              <div className="text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2">
                {info}
              </div>
            )}
            <div>
              <label className="text-xs text-zinc-400 block mb-1">{t('login.email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-bold disabled:opacity-60"
            >
              {submitting ? t('common.loading') : t('login.forgotSubmit')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setInfo('');
              }}
              className="w-full text-xs text-zinc-400 hover:text-zinc-200"
            >
              {t('login.backToLogin')}
            </button>
          </form>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          {error && (
            <div className="text-xs text-red-300 bg-red-950/60 border border-red-900 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs text-zinc-400 block mb-1">{t('login.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">{t('login.password')}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-bold disabled:opacity-60"
          >
            {submitting ? t('common.loading') : t('login.submit')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setError('');
              setInfo('');
            }}
            className="w-full text-xs text-zinc-400 hover:text-zinc-200"
          >
            {t('login.forgot')}
          </button>
        </form>
        )}

        <p className="text-center text-xs text-zinc-500">
          {t('login.noAccount')}{' '}
          <Link to="/signup" className="text-emerald-400 font-semibold">
            {t('login.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
