import React from 'react';

interface CamelotBadgeProps {
  keyString: string;
  size?: 'sm' | 'md' | 'lg';
}

// Color coding mapping based on Camelot Wheel colors
export function getCamelotColor(keyStr: string): { bg: string; text: string; border: string } {
  const clean = keyStr.trim().toUpperCase();
  const numMatch = clean.match(/^([0-1]?[0-9])/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 0;

  switch (num) {
    case 1:  return { bg: 'bg-purple-950/60', text: 'text-purple-300', border: 'border-purple-700/50' };
    case 2:  return { bg: 'bg-indigo-950/60', text: 'text-indigo-300', border: 'border-indigo-700/50' };
    case 3:  return { bg: 'bg-blue-950/60', text: 'text-blue-300', border: 'border-blue-700/50' };
    case 4:  return { bg: 'bg-cyan-950/60', text: 'text-cyan-300', border: 'border-cyan-700/50' };
    case 5:  return { bg: 'bg-teal-950/60', text: 'text-teal-300', border: 'border-teal-700/50' };
    case 6:  return { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-700/50' };
    case 7:  return { bg: 'bg-green-950/60', text: 'text-green-300', border: 'border-green-700/50' };
    case 8:  return { bg: 'bg-lime-950/60', text: 'text-lime-300', border: 'border-lime-700/50' };
    case 9:  return { bg: 'bg-yellow-950/60', text: 'text-yellow-300', border: 'border-yellow-700/50' };
    case 10: return { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-700/50' };
    case 11: return { bg: 'bg-orange-950/60', text: 'text-orange-300', border: 'border-orange-700/50' };
    case 12: return { bg: 'bg-rose-950/60', text: 'text-rose-300', border: 'border-rose-700/50' };
    default: return { bg: 'bg-zinc-800/80', text: 'text-zinc-300', border: 'border-zinc-700/50' };
  }
}

export const CamelotBadge: React.FC<CamelotBadgeProps> = ({ keyString, size = 'md' }) => {
  const { bg, text, border } = getCamelotColor(keyString);

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 min-w-[32px]',
    md: 'text-xs px-2 py-0.5 min-w-[38px]',
    lg: 'text-sm px-2.5 py-1 min-w-[44px]'
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-mono font-semibold rounded-md border shadow-xs tracking-wider ${bg} ${text} ${border} ${sizeClasses[size]}`}
      title={`${keyString}`}
    >
      {keyString}
    </span>
  );
};
