import React from 'react';
import { generateGaugePath, calculateGaugeRotation } from '@/utils/chart';
import { formatDose } from '@/utils/format';

interface DoseGaugeProps {
  value: number;
  max: number;
  warningThreshold?: number;
  dangerThreshold?: number;
  size?: number;
  showLabel?: boolean;
}

export const DoseGauge: React.FC<DoseGaugeProps> = ({
  value,
  max,
  warningThreshold = 0.5,
  dangerThreshold = 0.75,
  size = 180,
  showLabel = true
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;
  const strokeWidth = 16;

  const percentage = value / max;
  const rotation = calculateGaugeRotation(value, max);

  const getColor = () => {
    if (percentage >= dangerThreshold) return '#DC2626';
    if (percentage >= warningThreshold) return '#F59E0B';
    return '#10B981';
  };

  const color = getColor();
  const isWarning = percentage >= warningThreshold;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.75}>
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>

        <path
          d={generateGaugePath(cx, cy, radius, -135, 135)}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        <path
          d={generateGaugePath(cx, cy, radius, -135, -135 + (value / max) * 270)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={isWarning ? 'animate-pulse' : ''}
        />

        <line
          x1={cx}
          y1={cy}
          x2={cx + (radius - 10) * Math.cos((rotation - 90) * Math.PI / 180)}
          y2={cy + (radius - 10) * Math.sin((rotation - 90) * Math.PI / 180)}
          stroke="#374151"
          strokeWidth="3"
          strokeLinecap="round"
          className="transition-transform duration-500"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform: `rotate(${rotation}deg)`
          }}
        />

        <circle cx={cx} cy={cy} r="6" fill="#374151" />

        <text
          x={cx}
          y={cy + 30}
          textAnchor="middle"
          className="text-lg font-bold fill-gray-800"
        >
          {formatDose(value)}
        </text>

        <text
          x={cx}
          y={cy + 45}
          textAnchor="middle"
          className="text-xs fill-gray-500"
        >
          / {formatDose(max)}
        </text>
      </svg>

      {showLabel && (
        <div className="flex justify-between w-full px-4 mt-2">
          <span className="text-xs text-gray-400">0</span>
          <span className="text-xs text-yellow-500">{formatDose(max * warningThreshold)}</span>
          <span className="text-xs text-red-500">{formatDose(max * dangerThreshold)}</span>
          <span className="text-xs text-gray-400">{formatDose(max)}</span>
        </div>
      )}
    </div>
  );
};
