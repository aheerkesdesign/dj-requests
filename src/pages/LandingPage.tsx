import { Link } from 'react-router-dom';
import { Disc3, Music2, Radio, Users } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n/LanguageContext';
import { BrandName } from '../components/BrandName';

export default function LandingPage() {
  const { user, profile } = useAuth();
  const { t, locale, toggleLocale } = useI18n();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.15),_transparent_55%)] pointer-events-none" />
      <header className="relative max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 tracking-tight">
          <Disc3 className="w-6 h-6 text-emerald-400" />
          <BrandName />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLocale}
            className="min-w-[2.25rem] px-2 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-[11px] font-bold tracking-wide"
            title={t('common.language')}
            aria-label={t('common.language')}
          >
            {locale === 'nl' ? t('common.switchToNl') : t('common.switchToEn')}
          </button>
          {user ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-bold"
            >
              {t('landing.dashboard')}
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white">
                {t('landing.login')}
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-bold"
              >
                {t('landing.signup')}
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 pt-16 pb-24 space-y-16">
        <section className="max-w-2xl space-y-5">
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">{t('landing.forDjs')}</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            {t('landing.hero')}
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            {t('landing.heroBody')}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {user && profile ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 text-sm font-bold"
                >
                  {t('landing.toDashboard')}
                </Link>
                <Link
                  to={`/d/${profile.slug}`}
                  className="px-5 py-3 rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-200"
                >
                  {t('landing.viewPublic')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 text-sm font-bold"
                >
                  {t('landing.startFree')}
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-3 rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-200"
                >
                  {t('landing.hasAccount')}
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: Music2,
              title: t('landing.featureXmlTitle'),
              body: t('landing.featureXmlBody'),
            },
            {
              icon: Radio,
              title: t('landing.featureLiveTitle'),
              body: t('landing.featureLiveBody'),
            },
            {
              icon: Users,
              title: t('landing.featurePageTitle'),
              body: t('landing.featurePageBody'),
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-2">
              <Icon className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm">{title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
