import React, { useState, useEffect, useRef } from 'react';
import { X, Import, Upload, Check, AlertTriangle } from 'lucide-react';
import { parseRekordboxXML } from '../utils/xmlParser';
import { USBLibrary } from '../types';
import { useI18n } from '../i18n/LanguageContext';
import { errorMessage } from '../utils/errors';
import { ModalShell } from './ModalShell';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLibrary: USBLibrary | null;
  onUploadSuccess: (library: USBLibrary) => Promise<void>;
  allowUpload?: boolean;
  showDjTips?: boolean;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  currentLibrary,
  onUploadSuccess,
  allowUpload = true,
  showDjTips = true,
}) => {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [xmlContent, setXmlContent] = useState('');
  const [parsedPreview, setParsedPreview] = useState<USBLibrary | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const dragDepthRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setUploadError('');
      setFile(null);
      setXmlContent('');
      setParsedPreview(null);
      setIsDragging(false);
      dragDepthRef.current = 0;
    }
  }, [isOpen]);

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xml') && !selectedFile.name.endsWith('.txt')) {
      setUploadError(t('import.invalidXml'));
      setParsedPreview(null);
      setFile(null);
      setXmlContent('');
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
      } catch (err: unknown) {
        setUploadError(errorMessage(err, t('import.xmlReadError')));
        setParsedPreview(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowUpload) {
      setUploadError(t('import.loginToUpload'));
      return;
    }
    if (!xmlContent) {
      setUploadError(t('import.uploadRequired'));
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
    } catch (err: unknown) {
      setUploadError(errorMessage(err, t('import.saveError')));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ModalShell
      open={isOpen}
      panelClassName="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden text-foreground my-auto max-h-[90vh] flex flex-col"
    >
        <div className="px-5 py-4 border-b border-border bg-background/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/30 text-primary">
              <Import className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">{t('import.title')}</h3>
              {showDjTips && (
                <p className="text-[11px] text-muted-foreground">{t('import.subtitle')}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <form id="import-library-form" onSubmit={handleUploadSubmit} className="space-y-4">
            {uploadError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{uploadError}</span>
              </div>
            )}

            {currentLibrary && (
              <div className="p-3.5 rounded-xl bg-background/80 border border-border/80 text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground">{t('import.status')}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div>
                    <span className="text-muted-foreground">{t('import.tracks')}</span>{' '}
                    <strong className="text-primary">{currentLibrary.trackCount}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('import.playlists')}</span>{' '}
                    <strong className="text-muted-foreground">{currentLibrary.playlistCount}</strong>
                  </div>
                </div>
              </div>
            )}

            {showDjTips && (
              <div className="p-3 rounded-xl bg-background border border-border/80 text-[11px] text-foreground space-y-1">
                <span className="font-bold text-primary block">{t('import.howTitle')}</span>
                <p>{t('import.howStep1')}</p>
                <p>{t('import.howStep2')}</p>
                <p className="text-muted-foreground pt-0.5 border-t border-border/60 mt-1">
                  {t('import.howNote')}
                </p>
              </div>
            )}

            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                  : 'border-border hover:border-primary/40 bg-background/60 space-y-2'
              }`}
            >
              {isDragging ? (
                <div className="flex flex-col items-center justify-center gap-2 py-2">
                  <Upload className="w-10 h-10 text-primary" aria-hidden />
                  <p className="text-xs font-bold text-primary">{t('import.dropHere')}</p>
                </div>
              ) : (
                <label className="group block cursor-pointer space-y-2 -m-5 p-5 rounded-2xl">
                  <input
                    type="file"
                    accept=".xml,.txt"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {file ? file.name : t('import.selectFile')}
                    </p>
                  </div>

                  <div className="flex items-center justify-center pt-1">
                    <span className="inline-block px-4 py-2 rounded-xl bg-primary group-hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-sm">
                      {t('import.chooseFile')}
                    </span>
                  </div>
                </label>
              )}
            </div>

            {parsedPreview && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 space-y-1.5 text-xs text-primary">
                <div className="font-bold flex items-center gap-1.5 text-primary">
                  <Check className="w-4 h-4" /> {t('import.xmlParsed')}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div>
                    <span className="text-muted-foreground">{t('import.totalTracks')}</span>{' '}
                    <strong className="text-primary">{parsedPreview.trackCount}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('import.playlists')}</span>{' '}
                    <strong className="text-muted-foreground">{parsedPreview.playlistCount}</strong>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-4 border-t border-border bg-background/80 flex items-center justify-end gap-2 shrink-0">
          <button
            type="submit"
            form="import-library-form"
            disabled={isUploading || !xmlContent || !allowUpload}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md disabled:opacity-40"
          >
            {isUploading ? t('import.uploading') : t('import.saveChanges')}
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
