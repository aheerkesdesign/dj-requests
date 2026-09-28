import React from 'react';
import { cn } from '@/lib/utils';
import { usePresence } from '../hooks/useMotionPresence';

interface ModalShellProps {
  open: boolean;
  children: React.ReactNode;
  /** Classes for the centered panel (card). */
  panelClassName?: string;
  /** Extra classes for the full-screen backdrop wrapper. */
  overlayClassName?: string;
  overlayTone?: 'dark' | 'muted';
}

/**
 * Shared popup shell with motion-kit enter/exit fades.
 */
export function ModalShell({
  open,
  children,
  panelClassName,
  overlayClassName,
  overlayTone = 'dark',
}: ModalShellProps) {
  const { present, overlayClassName: overlayMotion, panelClassName: panelMotion } =
    usePresence(open);

  if (!present) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        overlayTone === 'dark' ? 'bg-black/80 backdrop-blur-sm' : 'bg-background/80 backdrop-blur-md',
        overlayMotion,
        overlayClassName
      )}
    >
      <div className={cn(panelMotion, panelClassName)}>{children}</div>
    </div>
  );
}
