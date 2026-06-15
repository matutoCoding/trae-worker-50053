import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DataCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
    suffix?: string;
  };
  suffix?: string;
  color?: string;
  className?: string;
  onClick?: () => void;
}

export const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  suffix,
  color = '#0D47A1',
  className = '',
  onClick
}) => {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-800">{value}</span>
            {suffix && <span className="text-sm text-gray-500 ml-1">{suffix}</span>}
          </div>
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-xs font-medium ${
                  trend.isUp ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}{trend.suffix || '%'}
              </span>
              <span className="text-xs text-gray-400 ml-1">较上次</span>
            </div>
          )}
        </div>
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );
};
