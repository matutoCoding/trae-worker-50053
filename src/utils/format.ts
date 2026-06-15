export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals);
};

export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

export const formatDose = (dose: number): string => {
  if (dose >= 1000) {
    return `${(dose / 1000).toFixed(2)} Sv`;
  }
  return `${dose.toFixed(2)} mSv`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    mechanical: '机械',
    electrical: '电气',
    instrument: '仪表',
    radiation: '辐射',
    other: '其他',
    schedule: '进度管理',
    safety: '安全管理',
    quality: '质量管理',
    cost: '成本管理',
  };
  return labels[category] || category;
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    mechanical: '#3B82F6',
    electrical: '#F59E0B',
    instrument: '#8B5CF6',
    radiation: '#EF4444',
    other: '#6B7280',
    schedule: '#3B82F6',
    safety: '#EF4444',
    quality: '#10B981',
    cost: '#F59E0B',
  };
  return colors[category] || '#6B7280';
};

export const getSeverityLabel = (severity: string): string => {
  const labels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重',
  };
  return labels[severity] || severity;
};

export const getSeverityColor = (severity: string): string => {
  const colors: Record<string, string> = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#7C2D12',
    warning: '#F59E0B',
    danger: '#EF4444',
  };
  return colors[severity] || '#6B7280';
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    delayed: '已延期',
    passed: '通过',
    failed: '不通过',
    rework: '返工',
    approved: '已批准',
    rejected: '已拒绝',
    active: '有效',
    expired: '已过期',
    revoked: '已撤销',
    open: '处理中',
    closed: '已关闭',
    verified: '已验证',
    normal: '正常',
    maintenance: '检修中',
    defective: '故障',
    valid: '有效',
    expiring: '即将过期',
    available: '可用',
    on_site: '现场',
    training: '培训中',
    unavailable: '不可用',
  };
  return labels[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: '#6B7280',
    in_progress: '#3B82F6',
    completed: '#10B981',
    delayed: '#EF4444',
    passed: '#10B981',
    failed: '#EF4444',
    rework: '#F59E0B',
    approved: '#10B981',
    rejected: '#EF4444',
    active: '#10B981',
    expired: '#6B7280',
    revoked: '#EF4444',
    open: '#3B82F6',
    closed: '#6B7280',
    verified: '#10B981',
    normal: '#10B981',
    maintenance: '#F59E0B',
    defective: '#EF4444',
    valid: '#10B981',
    expiring: '#F59E0B',
    available: '#10B981',
    on_site: '#3B82F6',
    training: '#8B5CF6',
    unavailable: '#6B7280',
  };
  return colors[status] || '#6B7280';
};

export const getCertificateStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    valid: '有效',
    expiring: '即将过期',
    expired: '已过期',
  };
  return labels[status] || status;
};

export const getCertificateStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    valid: 'bg-green-100 text-green-700',
    expiring: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

export const getPermitTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    red: '红区',
    orange: '橙区',
    yellow: '黄区',
    green: '绿区',
  };
  return labels[type] || type;
};

export const getPermitTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    red: '#DC2626',
    orange: '#EA580C',
    yellow: '#CA8A04',
    green: '#16A34A',
  };
  return colors[type] || '#6B7280';
};

export const getMaintenanceTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    disassembly: '解体',
    inspection: '检查',
    repair: '维修',
    replacement: '更换',
    assembly: '组装',
  };
  return labels[type] || type;
};
