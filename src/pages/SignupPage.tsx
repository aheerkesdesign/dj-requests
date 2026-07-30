import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Disc3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n/LanguageContext';

export default function SignupPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setInfo('');

    const cleanSlug = slug.trim().toLowerCase();
    if (cleanSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
      setError(t('account.slugInvalid'));
      setSubmitting(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim() || undefined,
          slug: cleanSlug || undefined,
        },
      },
    });

    setSubmitting(false);

    if (authError) {
      const details =
        authError.message ||
        (authError as { error_description?: string }).error_description ||
        authError.code ||
        JSON.stringify(authError);
      setError(details === '{}' ? t('signup.failed') : details);
      console.error('Signup error:', authError);
      return;
    }

    // Supabase can return a user without session when email confirmation is required
    if (data.user && !data.session) {
      setInfo(t('signup.checkEmail'));
      return;
    }

    if (data.session) {
      navigate('/dashboard');
      return;
    }

    setError(t('signup.noSession'));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Disc3 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h1 className="text-xl font-bold">{t('signup.title')}</h1>
          <p className="text-xs text-zinc-400">{t('signup.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
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
            <label className="text-xs text-zinc-400 block mb-1">{t('signup.djName')}</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (!slug) {
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '')
                  );
                }
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">{t('signup.publicSlug')}</label>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500 font-mono">/d/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="dj-alex"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono outline-none focus:border-emerald-500"
              />
            </div>
          </div>
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
            {submitting ? t('common.loading') : t('signup.submit')}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500">
          {t('signup.hasAccount')}{' '}
          <Link to="/login" className="text-emerald-400 font-semibold">
            {t('signup.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
