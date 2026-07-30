import React, { useState, useEffect } from 'react';
import { X, Settings, Upload, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { parseRekordboxXML, generateSampleXMLString } from '../utils/xmlParser';
import { USBLibrary } from '../types';
import { useI18n } from '../i18n/LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLibrary: USBLibrary | null;
  onUploadSuccess: (library: USBLibrary) => Promise<void>;
  allowUpload?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentLibrary,
  onUploadSuccess,
  allowUpload = true,
}) => {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [xmlContent, setXmlContent] = useState('');
  const [parsedPreview, setParsedPreview] = useState<USBLibrary | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUploadError('');
      setFile(null);
      setXmlContent('');
      setParsedPreview(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xml') && !selectedFile.name.endsWith('.txt')) {
      setUploadError(t('settings.invalidXml'));
      return;
    }

    setFile(selectedFile);
    setUploadError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setXmlContent(text);
      try {
        const preview = parseRekordboxXML(
          text,
          currentLibrary?.name || 'Mijn USB Bibliotheek',
          currentLibrary?.djName || 'DJ'
        );
        setParsedPreview(preview);
      } catch (err: any) {
        setUploadError(err.message || t('settings.xmlReadError'));
        setParsedPreview(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleLoadSampleXML = () => {
    const sample = generateSampleXMLString();
    setXmlContent(sample);
    setFile(new File([sample], 'sample_rekordbox.xml', { type: 'text/xml' }));
    setUploadError('');
    try {
      const preview = parseRekordboxXML(
        sample,
        currentLibrary?.name || 'Mijn USB Bibliotheek',
        currentLibrary?.djName || 'DJ'
      );
      setParsedPreview(preview);
    } catch (err: any) {
      setUploadError(err.message);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowUpload) {
      setUploadError(t('settings.loginToUpload'));
      return;
    }
    if (!xmlContent) {
      setUploadError(t('settings.uploadRequired'));
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const finalLibrary = parseRekordboxXML(
        xmlContent,
        currentLibrary?.name || 'Mijn USB Bibliotheek',
        currentLibrary?.djName || 'DJ'
      );
      finalLibrary.logoUrl = currentLibrary?.logoUrl;
      finalLibrary.socials = currentLibrary?.socials;
      await onUploadSuccess(finalLibrary);
      onClose();
    } catch (err: any) {
      setUploadError(err.message || t('settings.saveError'));
    } finally {
      setIsUploading(false);
    }
  };

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

        <div className="p-5 overflow-y-auto">
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {uploadError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{uploadError}</span>
              </div>
            )}

            {currentLibrary && (
              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-400 space-y-1">
                <div className="font-semibold text-zinc-200">{t('settings.status')}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div>
                    <span className="text-zinc-500">{t('settings.tracks')}</span>{' '}
                    <strong className="text-emerald-400">{currentLibrary.trackCount}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">{t('settings.playlists')}</span>{' '}
                    <strong className="text-cyan-400">{currentLibrary.playlistCount}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-300 space-y-1">
              <span className="font-bold text-emerald-400 block">{t('settings.howTitle')}</span>
              <p>{t('settings.howStep1')}</p>
              <p>{t('settings.howStep2')}</p>
              <p className="text-zinc-400 pt-0.5 border-t border-zinc-800/60 mt-1">
                {t('settings.howNote')}
              </p>
            </div>

            <div className="border-2 border-dashed border-zinc-700/80 hover:border-emerald-500 rounded-2xl p-5 text-center bg-zinc-950/60 transition-colors space-y-2">
              <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-zinc-200">
                  {file ? file.name : t('settings.selectFile')}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {t('settings.supportsXml')}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <label className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs cursor-pointer shadow-sm">
                  {t('settings.chooseFile')}
                  <input
                    type="file"
                    accept=".xml,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleLoadSampleXML}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-cyan-300 border border-zinc-700 inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> {t('settings.sampleXml')}
                </button>
              </div>
            </div>

            {parsedPreview && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1.5 text-xs text-emerald-200">
                <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-4 h-4" /> {t('settings.xmlParsed')}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div>
                    <span className="text-zinc-400">{t('settings.totalTracks')}</span>{' '}
                    <strong className="text-emerald-300">{parsedPreview.trackCount}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400">{t('settings.playlists')}</span>{' '}
                    <strong className="text-cyan-300">{parsedPreview.playlistCount}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isUploading || !xmlContent || !allowUpload}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-40"
              >
                {isUploading ? t('settings.uploading') : t('settings.uploadLibrary')}
              </button>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-end shrink-0">
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
