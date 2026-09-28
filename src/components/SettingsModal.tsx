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
  const { t } = useI18n();
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

  if (!isOpen) return null;

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

  const toggleSetting = <K extends keyof LibrarySettings>(key: K) => {
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
      <CheckSquare className="w-5 h-5 text-zinc-500 shrink-0" />
      <span className="text-xs font-medium text-zinc-400">{label}</span>
    </div>
  );

  const renderOptionalRow = (audience: PrefAudience, field: OptionalField, label: string) => {
    const checked = prefs[audience][field];
    return (
      <button
        type="button"
        onClick={() => toggleField(audience, field)}
        disabled={!allowEdit}
        className="flex items-center gap-2.5 text-left select-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {checked ? (
          <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
        ) : (
          <Square className="w-5 h-5 text-zinc-600 shrink-0" />
        )}
        <span className="text-xs font-medium text-zinc-200">{label}</span>
      </button>
    );
  };

  const renderAudienceBlock = (audience: PrefAudience, title: string, subtitle: string) => (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold text-zinc-100">{title}</h4>
        <p className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="space-y-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-3.5">
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
      className="w-full flex items-start gap-3 text-left select-none disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="mt-0.5 shrink-0">
        {checked ? (
          <CheckSquare className="w-5 h-5 text-emerald-400" />
        ) : (
          <Square className="w-5 h-5 text-zinc-600" />
        )}
      </div>
      <div>
        <span className="text-xs font-medium text-zinc-200 block">{label}</span>
        <span className="text-[11px] text-zinc-500 mt-0.5 block">{hint}</span>
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
      <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
        {label}
      </h3>
      {open ? (
        <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
      ) : (
        <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800/80 text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100">{t('settings.title')}</h3>
              <p className="text-[11px] text-zinc-400">{t('settings.subtitle')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors"
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

          <div className="border-t border-zinc-800/60" />

          {/* ── 2. Requests ─────────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeader
              label={t('settings.sectionRequests')}
              open={requestsOpen}
              onToggle={() => setRequestsOpen((v) => !v)}
            />
            {requestsOpen && (
              <div className="rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-3.5 space-y-3">
                {renderToggleRow(
                  settings.enableDownloadRequests,
                  () => toggleSetting('enableDownloadRequests'),
                  t('settings.enableDownloadRequests'),
                  t('settings.enableDownloadRequestsHint')
                )}
              </div>
            )}
          </section>

          <div className="border-t border-zinc-800/60" />

          {/* ── 3. Guest experience ──────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeader
              label={t('settings.sectionGuest')}
              open={guestOpen}
              onToggle={() => setGuestOpen((v) => !v)}
            />
            {guestOpen && (
              <div className="rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-3.5 space-y-4">
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

          <div className="border-t border-zinc-800/60" />

          {/* ── 4. Language ─────────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeader
              label={t('settings.sectionLanguage')}
              open={languageOpen}
              onToggle={() => setLanguageOpen((v) => !v)}
            />
            {languageOpen && (
              <div className="rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-3.5 space-y-3">
                <div>
                  <span className="text-xs font-medium text-zinc-200 block">
                    {t('settings.pageDefaultLocale')}
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-0.5 block">
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
                            ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !allowEdit}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-40"
          >
            {isSaving ? t('common.saving') : t('settings.saveChanges')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
