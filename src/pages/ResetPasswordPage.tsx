import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Disc3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../i18n/LanguageContext';
import { BrandName } from '../components/BrandName';

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'INITIAL_SESSION' || event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setPhase(session ? 'ready' : 'invalid');
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('reset.mismatch'));
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPhase('done');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <Disc3 className="w-10 h-10 text-primary" />
            <BrandName className="text-lg" />
          </Link>
          <h1 className="text-xl font-bold">{t('reset.title')}</h1>
          <p className="text-xs text-muted-foreground">{t('reset.subtitle')}</p>
        </div>

        {phase === 'checking' && (
          <div className="flex justify-center py-8">
            <Disc3 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {phase === 'invalid' && (
          <div className="space-y-4 bg-card border border-border rounded-2xl p-5">
            <p className="text-sm text-foreground">{t('reset.invalid')}</p>
            <Link
              to="/login"
              className="block text-center text-xs font-semibold text-primary"
            >
              {t('login.backToLogin')}
            </Link>
          </div>
        )}

        {phase === 'done' && (
          <div className="space-y-4 bg-card border border-border rounded-2xl p-5">
            <p className="text-sm text-primary">{t('reset.success')}</p>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold"
            >
              {t('reset.toDashboard')}
            </button>
          </div>
        )}

        {phase === 'ready' && (
          <form onSubmit={handleSubmit} className="space-y-3 bg-card border border-border rounded-2xl p-5">
            {error && (
              <div className="text-xs text-red-300 bg-red-950/60 border border-red-900 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">{t('reset.password')}</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">{t('reset.confirm')}</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary/40"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold disabled:opacity-60"
            >
              {submitting ? t('common.loading') : t('reset.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
