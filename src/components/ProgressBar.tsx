import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  height?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = '#0D47A1',
  showLabel = true,
  height = '8px',
  className = ''
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        {showLabel && (
          <span className="text-xs text-gray-600 font-mono">{percentage.toFixed(1)}%</span>
        )}
      </div>
      <div
        className="w-full bg-gray-200 rounded overflow-hidden"
        style={{ height }}
      >
        <div
          className="h-full rounded transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};
