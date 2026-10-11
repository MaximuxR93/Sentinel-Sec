import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Severity } from '../../types';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  showIcon = true,
}) => {
  const config = {
    critical: {
      bg: '#FADADD',
      text: '#A1121F',
      border: '#F4AEB6',
      label: 'Critical',
      icon: ShieldAlert,
    },
    high: {
      bg: '#FCE4D6',
      text: '#9A3B0B',
      border: '#F7C4A5',
      label: 'High',
      icon: AlertTriangle,
    },
    medium: {
      bg: '#FBF0D9',
      text: '#7A5200',
      border: '#F3DCAB',
      label: 'Medium',
      icon: AlertCircle,
    },
    low: {
      bg: '#E3EEF8',
      text: '#1F4E79',
      border: '#C7DCF0',
      label: 'Low',
      icon: Info,
    },
  }[severity];

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-[12px] px-2.5 py-1 gap-1.5',
    lg: 'text-[13px] px-3 py-1.5 gap-2 font-[500]',
  }[size];

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-[520] tracking-tight border ${sizeClasses}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
      }}
    >
      {showIcon && <IconComponent size={iconSizes} strokeWidth={1.7} aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
};
