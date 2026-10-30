import { type ReactNode, type CSSProperties } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className = '', style, hover = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`glass-card ${hover ? 'transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
