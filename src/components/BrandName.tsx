import React from 'react';

interface BrandNameProps {
  className?: string;
}

/** Product wordmark: "track" regular, "drop" bold. */
export const BrandName: React.FC<BrandNameProps> = ({ className = '' }) => (
  <span className={`tracking-tight ${className}`.trim()} aria-label="trackdrop">
    <span className="font-normal">track</span>
    <span className="font-bold">drop</span>
  </span>
);
