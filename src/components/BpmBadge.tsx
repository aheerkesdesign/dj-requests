import React from 'react';

interface BpmBadgeProps {
  bpm: number;
  size?: 'sm' | 'md' | 'lg';
}

export const BpmBadge: React.FC<BpmBadgeProps> = ({ bpm, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 min-w-[32px]',
    md: 'text-xs px-2 py-0.5 min-w-[38px]',
    lg: 'text-sm px-2.5 py-1 min-w-[44px]',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-heading tabular-nums font-semibold rounded-md border shadow-xs tracking-wider bg-muted text-muted-foreground border-border ${sizeClasses[size]}`}
      title={`BPM: ${Math.round(bpm)}`}
    >
      {Math.round(bpm)} BPM
    </span>
  );
};
