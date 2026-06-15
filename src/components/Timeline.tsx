import React from 'react';
import { Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { getStatusColor } from '@/utils/format';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  time?: string;
  operator?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, className = '' }) => {
  const getIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={20} className="text-green-500" />;
      case 'in_progress':
        return <Clock size={20} className="text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle size={20} className="text-red-500" />;
      default:
        return <Circle size={20} className="text-gray-300" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const color = getStatusColor(item.status);

        return (
          <div key={item.id} className="relative flex gap-4">
            {!isLast && (
              <div
                className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200"
                style={{
                  background: item.status === 'completed' ? color : undefined,
                  height: 'calc(100% - 10px)'
                }}
              />
            )}

            <div className="relative z-10 flex-shrink-0 w-8 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
              {getIcon(item.status)}
            </div>

            <div className="flex-1 pb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-gray-800">{item.title}</h4>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    {item.status === 'completed' ? '已完成' :
                     item.status === 'in_progress' ? '进行中' :
                     item.status === 'failed' ? '失败' : '待开始'}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  {item.time && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {item.time}
                    </span>
                  )}
                  {item.operator && (
                    <span>操作人：{item.operator}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
