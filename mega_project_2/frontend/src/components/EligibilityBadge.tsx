import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface EligibilityBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EligibilityBadge: React.FC<EligibilityBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toLowerCase();

  const isEligible = normalized.includes('eligible') && !normalized.includes('potential') && !normalized.includes('not');
  const isPotential = normalized.includes('potential');
  const isNotEligible = normalized.includes('not eligible') || normalized.includes('rejected');

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm',
  };

  if (isEligible) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses[size]}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        {status}
      </span>
    );
  }

  if (isPotential) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300 ${sizeClasses[size]}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        {status}
      </span>
    );
  }

  if (isNotEligible) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300 ${sizeClasses[size]}`}>
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        {status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300 ${sizeClasses[size]}`}>
      <Clock className="w-3.5 h-3.5 text-blue-600" />
      {status}
    </span>
  );
};
