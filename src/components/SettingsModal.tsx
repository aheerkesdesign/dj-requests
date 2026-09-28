import React, { useState, useEffect } from 'react';
import { X, Settings, CheckSquare, Square, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import {
  TrackDisplayPrefs,
  TrackFieldVisibility,
  DEFAULT_TRACK_DISPLAY_PREFS,
  normalizeTrackDisplayPrefs,
  LibrarySettings,
  DEFAULT_LIBRARY_SETTINGS,
  normalizeLibrarySettings,
} from '../types';
import { errorMessage } from '../utils/errors';
import { ModalShell } from './ModalShell';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackDisplayPrefs?: TrackDisplayPrefs;
  librarySettings?: LibrarySettings;
  onSavePrefs: (prefs: TrackDisplayPrefs, settings: LibrarySettings) => Promise<void>;
  allowEdit?: boolean;
}

type PrefAudience = 'dj' | 'viewers';
type OptionalField = keyof TrackFieldVisibility;

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  trackDisplayPrefs,
  librarySettings,
  onSavePrefs,
  allowEdit = true,
}) => {
  const { t, locale, setLocale } = useI18n();
  const [prefs, setPrefs] = useState<TrackDisplayPrefs>(DEFAULT_TRACK_DISPLAY_PREFS);
  const [settings, setSettings] = useState<LibrarySettings>(DEFAULT_LIBRARY_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Collapsible sections
  const [displayOpen, setDisplayOpen] = useState(true);
  const [requestsOpen, setRequestsOpen] = useState(true);
  const [guestOpen, setGuestOpen] = useState(true);
  const [languageOpen, setLanguageOpen] = useState(true);

  // Only reset local form state when the modal opens — not when parent prefs
  // update mid-save (that was clearing the "Saving..." button label).
  useEffect(() => {
    if (!isOpen) return;
    setPrefs(normalizeTrackDisplayPrefs(trackDisplayPrefs));
    setSettings(normalizeLibrarySettings(librarySettings));
    setError('');
    setIsSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only on open
  }, [isOpen]);

  const toggleField = (audience: PrefAudience, field: OptionalField) => {
    if (!allowEdit) return;
    setPrefs((prev) => ({
      ...prev,
      [audience]: {
        ...prev[audience],
        [field]: !prev[audience][field],
      },
    }));
  };

  const toggleSetting = (
    key: {
      [K in keyof LibrarySettings]: LibrarySettings[K] extends boolean ? K : never;
    }[keyof LibrarySettings]
  ) => {
    if (!allowEdit) return;
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!allowEdit || isSaving) return;
    setIsSaving(true);
    setError('');
    try {
      await onSavePrefs(normalizeTrackDisplayPrefs(prefs), settings);
      onClose();
    } catch (err: unknown) {
      setError(errorMessage(err, t('settings.saveError')));
    } finally {
      setIsSaving(false);
    }
  };

  const renderMandatoryRow = (label: string) => (
    <div className="flex items-center gap-2.5 opacity-50 cursor-not-allowed select-none">
      <CheckSquare className="w-5 h-5 text-muted-foreground shrink-0" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );

  const renderOptionalRow = (audience: PrefAudience, field: OptionalField, label: string) => {
    const checked = prefs[audience][field];
    return (
      <button
        type="button"
        onClick={() => toggleField(audience, field)}
        disabled={!allowEdit}
        className="flex w-fit max-w-full items-center gap-2.5 text-left select-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="pointer-events-none inline-flex h-5 w-5 shrink-0 items-center justify-center">
          {checked ? (
            <CheckSquare className="h-5 w-5 text-primary" />
          ) : (
            <Square className="h-5 w-5 text-muted-foreground" />
          )}
        </span>
        <span className="text-xs font-medium text-foreground">{label}</span>
      </button>
    );
  };

  const renderAudienceBlock = (audience: PrefAudience, title: string, subtitle: string) => (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
        <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div className="space-y-2.5 rounded-xl bg-background/80 border border-border/80 p-3.5">
        {renderMandatoryRow(t('settings.fieldTitle'))}
        {renderMandatoryRow(t('settings.fieldArtist'))}
        {renderOptionalRow(audience, 'album', t('settings.fieldAlbum'))}
        {renderOptionalRow(audience, 'bpm', t('settings.fieldBpm'))}
        {renderOptionalRow(audience, 'key', t('settings.fieldKey'))}
        {renderOptionalRow(audience, 'genre', t('settings.fieldGenre'))}
        {renderOptionalRow(audience, 'duration', t('settings.fieldDuration'))}
        {renderOptionalRow(audience, 'year', t('settings.fieldYear'))}
      </div>
    </div>
  );

  const renderToggleRow = (
    checked: boolean,
    onToggle: () => void,
    label: string,
    hint: string
  ) => (
    <button
      type="button"
      onClick={onToggle}
      disabled={!allowEdit}
      className="flex w-fit max-w-full items-start gap-3 text-left select-none disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="pointer-events-none mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center">
        {checked ? (
          <CheckSquare className="h-5 w-5 text-primary" />
        ) : (
          <Square className="h-5 w-5 text-muted-foreground" />
        )}
      </span>
      <div>
        <span className="text-xs font-medium text-foreground block">{label}</span>
        <span className="text-[11px] text-muted-foreground mt-0.5 block">{hint}</span>
      </div>
    </button>
  );

  const SectionHeader = ({
    label,
    open,
    onToggle,
  }: {
    label: string;
    open: boolean;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-2 group"
    >
      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
        {label}
      </h3>
      {open ? (
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      )}
    </button>
  );

  return (
    <ModalShell
      open={isOpen}
      panelClassName="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden text-foreground my-auto max-h-[90vh] flex flex-col"
    >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-background/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/30 text-primary">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">{t('settings.title')}</h3>
              <p className="text-[11px] text-muted-foreground">{t('settings.subtitle')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* ── 1. Track Display ─────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeader
              label={t('settings.sectionDisplay')}
              open={displayOpen}
              onToggle={() => setDisplayOpen((v) => !v)}
            />
            {displayOpen && (
              <div className="space-y-4">
                {renderAudienceBlock('dj', t('settings.djSees'), t('settings.djSeesHint'))}
                {renderAudienceBlock('viewers', t('settings.viewersSee'), t('settings.viewersSeeHint'))}
              </div>
            )}
          </section>

          <div className="border-t border-border/60" />

          {/* ── 2. Requests ─────────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeader
              label={t('settings.sectionRequests')}
              open={requestsOpen}
              onToggle={() => setRequestsOpen((v) => !v)}
            />
            {requestsOpen && (
              <div className="rounded-xl bg-background/80 border border-border/80 p-3.5 space-y-3">
                {renderToggleRow(
                  settings.enableDownloadRequests,
                  () => toggleSetting('enableDownloadRequests'),
                  t('settings.enableDownloadRequests'),
                  t('settings.enableDownloadRequestsHint')
                )}
                {renderToggleRow(
                  settings.hideDjTips,
                  () => toggleSetting('hideDjTips'),
                  t('settings.hideDjTips'),
                  t('settings.hideDjTipsHint')
                )}
              </div>
            )}
          </section>

          <div className="border-t border-border/60" />

          {/* ── 3. Guest experience ──────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeader
              label={t('settings.sectionGuest')}
              open={guestOpen}
              onToggle={() => setGuestOpen((v) => !v)}
            />
            {guestOpen && (
              <div className="rounded-xl bg-background/80 border border-border/80 p-3.5 space-y-4">
                {renderToggleRow(
                  settings.skipStartScreen,
                  () => toggleSetting('skipStartScreen'),
                  t('settings.skipStartScreen'),
                  t('settings.skipStartScreenHint')
                )}
                {renderToggleRow(
                  settings.hidePlayedDeclinedFromGuests,
                  () => toggleSetting('hidePlayedDeclinedFromGuests'),
                  t('settings.hidePlayedDeclined'),
                  t('settings.hidePlayedDeclinedHint')
                )}
              </div>
            )}
          </section>

          <div className="border-t border-border/60" />

          {/* ── 4. Language ─────────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeader
              label={t('settings.sectionLanguage')}
              open={languageOpen}
              onToggle={() => setLanguageOpen((v) => !v)}
            />
            {languageOpen && (
              <div className="rounded-xl bg-background/80 border border-border/80 p-3.5 space-y-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-foreground block">
                      {t('settings.djLocale')}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      {t('settings.djLocaleHint')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['nl', 'en'] as const).map((val) => {
                      const label = val === 'nl' ? t('settings.localeNl') : t('settings.localeEn');
                      const active = locale === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={!allowEdit}
                          onClick={() => allowEdit && setLocale(val)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            active
                              ? 'bg-primary/20 border-primary/60 text-primary'
                              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-border'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-border/60" />

                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-foreground block">
                      {t('settings.pageDefaultLocale')}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      {t('settings.pageDefaultLocaleHint')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['auto', 'nl', 'en'] as const).map((val) => {
                      const label =
                        val === 'auto'
                          ? t('settings.localeAuto')
                          : val === 'nl'
                            ? t('settings.localeNl')
                            : t('settings.localeEn');
                      const active = settings.pageDefaultLocale === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={!allowEdit}
                          onClick={() =>
                            allowEdit && setSettings((prev) => ({ ...prev, pageDefaultLocale: val }))
                          }
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            active
                              ? 'bg-primary/20 border-primary/60 text-primary'
                              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-border'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-background/80 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !allowEdit}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md disabled:opacity-40"
          >
            {isSaving ? t('common.saving') : t('settings.saveChanges')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground"
          >
            {t('common.close')}
          </button>
        </div>
    </ModalShell>
  );
};
