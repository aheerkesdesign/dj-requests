import React, { useState, useEffect } from 'react';
import { X, Settings, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import {
  TrackDisplayPrefs,
  TrackFieldVisibility,
  DEFAULT_TRACK_DISPLAY_PREFS,
  normalizeTrackDisplayPrefs,
} from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackDisplayPrefs?: TrackDisplayPrefs;
  onSavePrefs: (prefs: TrackDisplayPrefs) => Promise<void>;
  allowEdit?: boolean;
}

type PrefAudience = 'dj' | 'viewers';
type OptionalField = keyof TrackFieldVisibility;

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  trackDisplayPrefs,
  onSavePrefs,
  allowEdit = true,
}) => {
  const { t } = useI18n();
  const [prefs, setPrefs] = useState<TrackDisplayPrefs>(DEFAULT_TRACK_DISPLAY_PREFS);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPrefs(normalizeTrackDisplayPrefs(trackDisplayPrefs));
      setError('');
      setIsSaving(false);
    }
  }, [isOpen, trackDisplayPrefs]);

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

  const handleSave = async () => {
    if (!allowEdit) return;
    setIsSaving(true);
    setError('');
    try {
      await onSavePrefs(normalizeTrackDisplayPrefs(prefs));
      onClose();
    } catch (err: any) {
      setError(err.message || t('settings.saveError'));
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
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 my-auto max-h-[90vh] flex flex-col">
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

        <div className="p-5 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">{t('settings.preferences')}</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">{t('settings.preferencesHint')}</p>
            </div>

            {renderAudienceBlock('dj', t('settings.djSees'), t('settings.djSeesHint'))}
            {renderAudienceBlock('viewers', t('settings.viewersSee'), t('settings.viewersSeeHint'))}
          </section>
        </div>

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
