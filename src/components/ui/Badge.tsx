import { type ReactNode } from 'react';
import type { RiskLevel, ScanStatus } from '@/types';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

export function Badge({ children, variant = 'default', size = 'sm', icon }: BadgeProps) {
  const variants = {
    default: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
    success: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
    warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
    danger: 'bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-300',
    info: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
    neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  };

  const sizes = { sm: 'px-2.5 py-1 text-xs', md: 'px-3.5 py-1.5 text-sm' };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {icon}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ScanStatus }) {
  const config: Record<ScanStatus, { variant: BadgeProps['variant']; label: string }> = {
    verified: { variant: 'success', label: 'Verified' },
    review: { variant: 'warning', label: 'Review Required' },
    'high-risk': { variant: 'danger', label: 'High Risk' },
    processing: { variant: 'info', label: 'Processing' },
    failed: { variant: 'danger', label: 'Failed' },
  };
  const { variant, label } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const config: Record<RiskLevel, { variant: BadgeProps['variant']; label: string }> = {
    low: { variant: 'success', label: 'Low Risk' },
    moderate: { variant: 'warning', label: 'Moderate Risk' },
    high: { variant: 'danger', label: 'High Risk' },
    critical: { variant: 'danger', label: 'Critical Risk' },
  };
  const { variant, label } = config[level];
  return <Badge variant={variant}>{label}</Badge>;
}
