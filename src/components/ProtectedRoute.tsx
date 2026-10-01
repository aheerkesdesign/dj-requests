import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Disc3 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n/LanguageContext';

interface ProtectedRouteProps {
  children: ReactNode;
  /** When true, also require a loaded profile (shows recovery UI if missing). */
  requireProfile?: boolean;
}

export function ProtectedRoute({ children, requireProfile = false }: ProtectedRouteProps) {
  const { user, profile, loading, signOut } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Disc3 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requireProfile && !profile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 text-center space-y-3">
        <Disc3 className="w-10 h-10 text-primary" />
        <h1 className="text-lg font-bold">{t('dashboard.profileFailed')}</h1>
        <p className="text-sm text-muted-foreground max-w-md">{t('dashboard.profileHelp')}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
        >
          {t('common.refresh')}
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-xs text-muted-foreground underline"
        >
          {t('common.logout')}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
