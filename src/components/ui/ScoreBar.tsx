import { useEffect, useState } from 'react';

interface ScoreBarProps {
  label: string;
  value: number;
  delay?: number;
}

export function ScoreBar({ label, value, delay = 0 }: ScoreBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(value), delay + 100);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const color = value >= 75 ? 'from-success-500 to-success-400' : value >= 50 ? 'from-warning-500 to-warning-400' : 'from-danger-500 to-danger-400';

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-neutral-600 dark:text-neutral-400 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-sm font-mono font-semibold text-neutral-700 dark:text-neutral-300 w-10 text-right">{value}%</span>
    </div>
  );
}
