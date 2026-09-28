import { Link, Navigate } from 'react-router-dom';
import { Disc3, Music2, Radio, Users } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n/LanguageContext';
import { BrandName } from '../components/BrandName';
import { LocaleToggle } from '../components/LocaleToggle';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="relative max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 tracking-tight">
          <Disc3 className="w-6 h-6 text-primary" />
          <BrandName />
        </div>
        <div className="flex items-center gap-2">
          <LocaleToggle />
          <Link to="/login" className="px-3 py-2 text-xs font-semibold text-foreground hover:text-white">
            {t('landing.login')}
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
          >
            {t('landing.signup')}
          </Link>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 pt-16 pb-24 space-y-16">
        <section className="max-w-2xl space-y-5">
          <p className="font-heading text-primary text-xs font-semibold uppercase tracking-[0.06em]">{t('landing.forDjs')}</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            {t('landing.hero')}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            {t('landing.heroBody')}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/signup"
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
            >
              {t('landing.startFree')}
            </Link>
            <Link
              to="/login"
              className="px-5 py-3 rounded-xl border border-border text-sm font-semibold text-foreground"
            >
              {t('landing.hasAccount')}
            </Link>
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
            <div key={title} className="rounded-2xl border border-border bg-card/60 p-5 space-y-2">
              <Icon className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
