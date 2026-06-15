import React, { useState, useMemo } from 'react';
import { useEquipmentStore } from '@/store/equipmentStore';
import { useQualityStore } from '@/store/qualityStore';
import { DataCard } from '@/components/DataCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { Equipment, MaintenanceRecord, Defect, DefectStatus, DefectSeverity } from '@/types';
import {
  Cog,
  Wrench,
  Package,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Eye,
  Calendar,
  MapPin,
  User,
  FileText,
  Ruler,
  AlertCircle,
  Box,
  Layers,
  Settings,
  Shield,
  Plus,
  ArrowRight,
  GitBranch
} from 'lucide-react';
import { formatDate } from '@/utils/date';
import { getMaintenanceTypeLabel, getStatusLabel } from '@/utils/format';

type TabMode = 'equipment' | 'records' | 'spareparts' | 'defects';
type FilterSystem = 'all' | string;
type FilterStatus = 'all' | string;

const getDefectStatusLabel = (status: DefectStatus): string => {
  const labels: Record<DefectStatus, string> = {
    open: '待分配',
    assigned: '已分配',
    in_progress: '处理中',
    resolved: '已解决',
    verified: '已验证',
    closed: '已关闭'
  };
  return labels[status] || status;
};

const getDefectStatusColor = (status: DefectStatus): string => {
  const colors: Record<DefectStatus, string> = {
    open: 'bg-yellow-100 text-yellow-700',
    assigned: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-indigo-100 text-indigo-700',
    resolved: 'bg-green-100 text-green-700',
    verified: 'bg-teal-100 text-teal-700',
    closed: 'bg-gray-100 text-gray-500'
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

const getSeverityLabel = (severity: DefectSeverity): string => {
  const labels: Record<DefectSeverity, string> = {
    minor: '一般',
    major: '重要',
    critical: '严重'
  };
  return labels[severity] || severity;
};

const getSeverityColor = (severity: DefectSeverity): string => {
  const colors: Record<DefectSeverity, string> = {
    minor: 'bg-blue-100 text-blue-700',
    major: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700'
  };
  return colors[severity] || 'bg-gray-100 text-gray-700';
};

const getSourceTypeLabel = (sourceType: string): string => {
  const labels: Record<string, string> = {
    measurement: '测量数据',
    finding: '检查发现',
    quality_check: '质量检查'
  };
  return labels[sourceType] || sourceType;
};

const getNextStatus = (current: DefectStatus): DefectStatus | null => {
  const flow: DefectStatus[] = ['open', 'assigned', 'in_progress', 'resolved', 'verified', 'closed'];
  const idx = flow.indexOf(current);
  return idx < flow.length - 1 ? flow[idx + 1] : null;
};

const getNextStatusLabel = (current: DefectStatus): string => {
  const next = getNextStatus(current);
  if (!next) return '';
  return getDefectStatusLabel(next);
};

const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    created: '创建缺陷',
    assigned: '分配责任人',
    in_progress: '开始处理',
    resolved: '已解决',
    verified: '已验证',
    closed: '已关闭'
  };
  return labels[action] || action;
};

export const Maintenance: React.FC = () => {
  const {
    equipment,
    maintenanceRecords,
    defects,
    getEquipmentBySystem,
    getEquipmentByStatus,
    getRecordsByEquipment,
    updateMaintenanceRecord,
    addDefect,
    updateDefect,
    advanceDefectStatus,
    closeDefect,
    getDefectsByEquipment,
    getDefectsByRecord,
    getUnclosedDefectCount
  } = useEquipmentStore();

  const { updateCheckFromDefect } = useQualityStore();

  const [activeTab, setActiveTab] = useState<TabMode>('equipment');
  const [systemFilter, setSystemFilter] = useState<FilterSystem>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [showDefectForm, setShowDefectForm] = useState(false);
  const [defectFormSource, setDefectFormSource] = useState<'finding' | 'measurement'>('finding');
  const [defectFormSourceDetail, setDefectFormSourceDetail] = useState('');
  const [defectFormTitle, setDefectFormTitle] = useState('');
  const [defectFormSeverity, setDefectFormSeverity] = useState<DefectSeverity>('minor');
  const [defectFormAssignedTo, setDefectFormAssignedTo] = useState('');
  const [defectResolution, setDefectResolution] = useState('');
  const [defectVerifiedBy, setDefectVerifiedBy] = useState('');
  const [defectVerifiedResult, setDefectVerifiedResult] = useState('');

  const systems = useMemo(() => {
    const sys = new Set(equipment.map(e => e.system));
    return ['all', ...Array.from(sys)];
  }, [equipment]);

  const filteredEquipment = useMemo(() => {
    return equipment.filter(eq => {
      const matchSystem = systemFilter === 'all' || eq.system === systemFilter;
      const matchStatus = statusFilter === 'all' || eq.status === statusFilter;
      const matchSearch = searchQuery === '' ||
        eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSystem && matchStatus && matchSearch;
    });
  }, [equipment, systemFilter, statusFilter, searchQuery]);

  const maintenanceEquipment = getEquipmentByStatus('maintenance');
  const normalEquipment = getEquipmentByStatus('normal');
  const defectiveEquipment = getEquipmentByStatus('defective');

  const inProgressRecords = maintenanceRecords.filter(r => r.status === 'in_progress');
  const completedRecords = maintenanceRecords.filter(r => r.status === 'completed');
  const pendingRecords = maintenanceRecords.filter(r => r.status === 'pending');

  const unclosedDefectCount = useMemo(() => {
    return defects.filter(d => d.status !== 'closed').length;
  }, [defects]);

  const selectedEquipmentRecords = useMemo(() => {
    if (!selectedEquipment) return [];
    return getRecordsByEquipment(selectedEquipment.id);
  }, [selectedEquipment, getRecordsByEquipment]);

  const selectedRecordDefects = useMemo(() => {
    if (!selectedRecord) return [];
    return getDefectsByRecord(selectedRecord.id);
  }, [selectedRecord, getDefectsByRecord]);

  const allSpareParts = useMemo(() => {
    const parts: Array<{ name: string; partNumber: string; quantity: number; used: number; status: string; equipmentName: string; }> = [];
    maintenanceRecords.forEach(record => {
      record.spareParts.forEach(part => {
        parts.push({
          name: part.name,
          partNumber: part.partNumber,
          quantity: part.quantity,
          used: part.usedQuantity,
          status: part.status,
          equipmentName: record.equipmentName
        });
      });
    });
    return parts;
  }, [maintenanceRecords]);

  const getEquipmentStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-700';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700';
      case 'defective':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPartStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      reserved: '已预留',
      issued: '已领用',
      used: '已使用',
      returned: '已归还'
    };
    return labels[status] || status;
  };

  const getPartStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      reserved: 'bg-blue-100 text-blue-700',
      issued: 'bg-yellow-100 text-yellow-700',
      used: 'bg-green-100 text-green-700',
      returned: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const parseValue = (str: string): number | null => {
    const match = str.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  };

  const checkMeasurementStatus = (value: string, standard: string): 'normal' | 'abnormal' | 'unknown' => {
    if (!value || !standard) return 'unknown';

    const numValue = parseValue(value);
    if (numValue === null) return 'unknown';

    const s = standard.trim();

    const toleranceMatch = s.match(/^([\d.]+)\s*[±\+]\s*([\d.]+)$/);
    if (toleranceMatch) {
      const center = parseFloat(toleranceMatch[1]);
      const tolerance = parseFloat(toleranceMatch[2]);
      if (!isNaN(center) && !isNaN(tolerance)) {
        return numValue >= center - tolerance && numValue <= center + tolerance ? 'normal' : 'abnormal';
      }
    }

    if (s.startsWith('≥') || s.startsWith('>=')) {
      const minVal = parseValue(s.substring(s.startsWith('>=') ? 2 : 1));
      if (minVal !== null) return numValue >= minVal ? 'normal' : 'abnormal';
    } else if (s.startsWith('≤') || s.startsWith('<=')) {
      const maxVal = parseValue(s.substring(s.startsWith('<=') ? 2 : 1));
      if (maxVal !== null) return numValue <= maxVal ? 'normal' : 'abnormal';
    } else if (s.startsWith('>')) {
      const minVal = parseValue(s.substring(1));
      if (minVal !== null) return numValue > minVal ? 'normal' : 'abnormal';
    } else if (s.startsWith('<')) {
      const maxVal = parseValue(s.substring(1));
      if (maxVal !== null) return numValue < maxVal ? 'normal' : 'abnormal';
    } else if (s.includes('~')) {
      const parts = s.split('~');
      if (parts.length === 2) {
        const minVal = parseValue(parts[0]);
        const maxVal = parseValue(parts[1]);
        if (minVal !== null && maxVal !== null) {
          return numValue >= minVal && numValue <= maxVal ? 'normal' : 'abnormal';
        }
      }
    } else {
      const rangeMatch = s.match(/^([\d.]+)\s*[-–]\s*([\d.]+)$/);
      if (rangeMatch) {
        const minVal = parseFloat(rangeMatch[1]);
        const maxVal = parseFloat(rangeMatch[2]);
        if (!isNaN(minVal) && !isNaN(maxVal) && maxVal > minVal) {
          return numValue >= minVal && numValue <= maxVal ? 'normal' : 'abnormal';
        }
      }

      const exactVal = parseValue(s);
      if (exactVal !== null) {
        return Math.abs(numValue - exactVal) < 0.001 ? 'normal' : 'abnormal';
      }
    }

    return 'unknown';
  };

  const handleConvertToDefect = (source: 'finding' | 'measurement', detail: string) => {
    setDefectFormSource(source);
    setDefectFormSourceDetail(detail);
    setDefectFormTitle('');
    setDefectFormSeverity('minor');
    setDefectFormAssignedTo('');
    setShowDefectForm(true);
  };

  const handleSubmitDefect = () => {
    if (!selectedRecord || !defectFormTitle.trim()) return;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newDefect: Defect = {
      id: `DEF-${Date.now()}`,
      title: defectFormTitle,
      description: defectFormSourceDetail,
      severity: defectFormSeverity,
      status: 'open',
      equipmentId: selectedRecord.equipmentId,
      equipmentName: selectedRecord.equipmentName,
      maintenanceRecordId: selectedRecord.id,
      sourceType: defectFormSource,
      sourceDetail: defectFormSourceDetail,
      assignedTo: defectFormAssignedTo,
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: '当前用户',
      resolvedDate: '',
      resolution: '',
      verifiedBy: '',
      verifiedDate: '',
      verifiedResult: '',
      closedBy: '',
      closedDate: '',
      actionLogs: [{
        id: `log-${Date.now()}`,
        action: 'created',
        status: 'open',
        operator: '当前用户',
        timestamp,
        comment: `从检修记录转入，来源：${getSourceTypeLabel(defectFormSource)}`
      }]
    };
    addDefect(newDefect);
    setShowDefectForm(false);
    setDefectFormTitle('');
    setDefectFormSeverity('minor');
    setDefectFormAssignedTo('');
    setDefectFormSourceDetail('');
  };

  const handleAdvanceDefectStatus = () => {
    if (!selectedDefect) return;
    
    let operator = '当前用户';
    let comment = '';
    
    if (selectedDefect.status === 'open' && defectFormAssignedTo) {
      operator = defectFormAssignedTo;
      comment = `分配给 ${defectFormAssignedTo} 处理`;
    } else if (selectedDefect.status === 'in_progress') {
      comment = defectResolution;
    } else if (selectedDefect.status === 'resolved') {
      operator = defectVerifiedBy || '当前用户';
      comment = defectVerifiedResult;
    }
    
    const updated = advanceDefectStatus(selectedDefect.id, operator, comment);
    if (updated) {
      setSelectedDefect(updated);
      if (updated.qualityCheckId) {
        updateCheckFromDefect(updated.qualityCheckId, updated.status, updated.resolution);
      }
      setDefectFormAssignedTo('');
      setDefectResolution('');
      setDefectVerifiedBy('');
      setDefectVerifiedResult('');
    }
  };

  const [defectCloseOperator, setDefectCloseOperator] = useState('');
  const [defectCloseComment, setDefectCloseComment] = useState('');

  const handleCloseDefect = () => {
    if (!selectedDefect) return;
    const updated = closeDefect(
      selectedDefect.id,
      defectCloseOperator || '当前用户',
      defectCloseComment
    );
    if (updated) {
      setSelectedDefect(updated);
      if (updated.qualityCheckId) {
        updateCheckFromDefect(updated.qualityCheckId, updated.status, updated.resolution);
      }
      setDefectCloseOperator('');
      setDefectCloseComment('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">设备检修管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理设备解体检修、备件更换和质量检查</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <DataCard
          title="设备总数"
          value={equipment.length}
          icon={Cog}
          color="#0D47A1"
        />
        <DataCard
          title="检修中"
          value={maintenanceEquipment.length}
          icon={Wrench}
          color="#E65100"
        />
        <DataCard
          title="进行中工单"
          value={inProgressRecords.length}
          icon={Clock}
          color="#3B82F6"
        />
        <DataCard
          title="已完成工单"
          value={completedRecords.length}
          icon={CheckCircle}
          color="#10B981"
        />
        <DataCard
          title="未关闭缺陷"
          value={unclosedDefectCount}
          icon={Shield}
          color="#DC2626"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'equipment', label: '设备台账', icon: Cog },
            { key: 'records', label: '检修记录', icon: FileText },
            { key: 'spareparts', label: '备件管理', icon: Package },
            { key: 'defects', label: '缺陷闭环', icon: Shield }
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key as TabMode)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === item.key
                    ? 'border-[#0D47A1] text-[#0D47A1] bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'equipment' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索设备名称或编号..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={systemFilter}
                    onChange={(e) => setSystemFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] bg-white"
                  >
                    {systems.map(sys => (
                      <option key={sys} value={sys}>
                        {sys === 'all' ? '全部系统' : sys}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] bg-white"
                  >
                    <option value="all">全部状态</option>
                    <option value="normal">正常</option>
                    <option value="maintenance">检修中</option>
                    <option value="defective">故障</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {filteredEquipment.map(eq => {
                  const unclosedCount = getUnclosedDefectCount(eq.id);
                  return (
                    <div
                      key={eq.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#0D47A1] transition-colors cursor-pointer"
                      onClick={() => setSelectedEquipment(eq)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            eq.status === 'normal' ? 'bg-green-100' :
                            eq.status === 'maintenance' ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                            <Cog size={24} className={`${
                              eq.status === 'normal' ? 'text-green-600' :
                              eq.status === 'maintenance' ? 'text-yellow-600' : 'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{eq.name}</h4>
                            <p className="text-sm text-gray-500">{eq.code}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getEquipmentStatusColor(eq.status)}`}>
                                {getStatusLabel(eq.status)}
                              </span>
                              <span className="text-xs text-gray-400">{eq.system}</span>
                            </div>
                          </div>
                        </div>
                        <Eye size={18} className="text-gray-400" />
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">位置</p>
                          <p className="text-sm text-gray-800">{eq.location}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">上次检修</p>
                          <p className="text-sm text-gray-800">{formatDate(eq.lastMaintenance)}</p>
                        </div>
                      </div>
                      {eq.status === 'maintenance' && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>检修进度</span>
                            <span>预计完成: {formatDate(eq.nextMaintenance)}</span>
                          </div>
                          <ProgressBar
                            value={65}
                            height="4px"
                            showLabel={false}
                            color="#E65100"
                          />
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className={`text-xs ${unclosedCount > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                          未关闭缺陷: {unclosedCount}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备名称</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">检修类型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作业人员</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">开始时间</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">结束时间</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备件</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {maintenanceRecords.map(record => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{record.equipmentName}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            {getMaintenanceTypeLabel(record.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{record.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{record.operator}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{record.startTime}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{record.endTime}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="px-4 py-3">
                          {record.spareParts.length > 0 ? (
                            <span className="text-sm text-gray-600">{record.spareParts.length} 项</span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                            title="查看详情"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'spareparts' && (
            <div className="space-y-4">
              {allSpareParts.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Package size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>暂无备件记录</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备件名称</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备件编号</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">所属设备</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">计划数量</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">已使用</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allSpareParts.map((part, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{part.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono">{part.partNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{part.equipmentName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{part.quantity} {part.status.includes('unit') ? '' : '个/套'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{part.used}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getPartStatusColor(part.status)}`}>
                              {getPartStatusLabel(part.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'defects' && (
            <div className="space-y-4">
              {defects.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Shield size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>暂无缺陷记录</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">严重程度</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源类型</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">责任人</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {defects.map(defect => (
                        <tr key={defect.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{defect.title}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{defect.equipmentName}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(defect.severity)}`}>
                              {getSeverityLabel(defect.severity)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{getSourceTypeLabel(defect.sourceType)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{defect.assignedTo || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDefectStatusColor(defect.status)}`}>
                              {getDefectStatusLabel(defect.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setSelectedDefect(defect);
                                setDefectResolution('');
                                setDefectVerifiedBy('');
                                setDefectVerifiedResult('');
                                setDefectFormAssignedTo('');
                              }}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                              title="查看详情"
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">{selectedEquipment.name}</h3>
              <button
                onClick={() => setSelectedEquipment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">设备编号</p>
                  <p className="text-sm font-medium text-gray-800">{selectedEquipment.code}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">所属系统</p>
                  <p className="text-sm font-medium text-gray-800">{selectedEquipment.system}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">设备状态</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getEquipmentStatusColor(selectedEquipment.status)}`}>
                    {getStatusLabel(selectedEquipment.status)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">安装位置</p>
                  <p className="text-sm font-medium text-gray-800">{selectedEquipment.location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">上次检修</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(selectedEquipment.lastMaintenance)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">下次检修</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(selectedEquipment.nextMaintenance)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">本次大修检修记录</h4>
                {selectedEquipmentRecords.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                    <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                    <p>暂无检修记录</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEquipmentRecords.map(record => (
                      <div
                        key={record.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-[#0D47A1] transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedRecord(record);
                          setSelectedEquipment(null);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                {getMaintenanceTypeLabel(record.type)}
                              </span>
                              <StatusBadge status={record.status} />
                            </div>
                            <p className="font-medium text-gray-800 mt-2">{record.description}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              作业人员: {record.operator} | {record.startTime} ~ {record.endTime}
                            </p>
                          </div>
                          <Eye size={18} className="text-gray-400" />
                        </div>
                        {record.findings && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">检查发现</p>
                            <p className="text-sm text-gray-800 mt-1">{record.findings}</p>
                          </div>
                        )}
                        {record.spareParts.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-2">更换备件</p>
                            <div className="flex flex-wrap gap-2">
                              {record.spareParts.map(part => (
                                <span key={part.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {part.name} x{part.usedQuantity || part.quantity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">检修记录详情</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Wrench size={24} className="text-[#0D47A1]" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{selectedRecord.description}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {getMaintenanceTypeLabel(selectedRecord.type)}
                    </span>
                    <StatusBadge status={selectedRecord.status} />
                    <span className="text-sm text-gray-500">{selectedRecord.equipmentName}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">作业人员</p>
                  <p className="text-sm font-medium text-gray-800">{selectedRecord.operator}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">工单编号</p>
                  <p className="text-sm font-medium text-gray-800 font-mono">{selectedRecord.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">开始时间</p>
                  <p className="text-sm font-medium text-gray-800">{selectedRecord.startTime}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">结束时间</p>
                  <p className="text-sm font-medium text-gray-800">{selectedRecord.endTime}</p>
                </div>
              </div>

              {selectedRecord.findings && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-yellow-800">检查发现</p>
                        <button
                          onClick={() => handleConvertToDefect('finding', selectedRecord.findings)}
                          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 bg-red-50 rounded hover:bg-red-100 transition-colors"
                        >
                          <Plus size={12} />
                          转为缺陷项
                        </button>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">{selectedRecord.findings}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedRecord.measurements.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-800 mb-3">测量数据</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">测量项目</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">测量值</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">单位</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">标准值</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">结果</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedRecord.measurements.map((m, idx) => {
                          const status = checkMeasurementStatus(m.value, m.standard);
                          return (
                            <tr key={idx} className={status === 'abnormal' ? 'bg-red-50' : ''}>
                              <td className="px-3 py-2 text-sm text-gray-800">{m.name}</td>
                              <td className={`px-3 py-2 text-sm font-medium ${status === 'abnormal' ? 'text-red-600' : 'text-gray-800'}`}>
                                {m.value}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600">{m.unit}</td>
                              <td className="px-3 py-2 text-sm text-gray-600">{m.standard}</td>
                              <td className="px-3 py-2">
                                {status === 'normal' ? (
                                  <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                                    <CheckCircle size={14} />
                                    合格
                                  </span>
                                ) : status === 'abnormal' ? (
                                  <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                                    <AlertTriangle size={14} />
                                    异常
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
                                    <AlertCircle size={14} />
                                    待判定
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {status === 'abnormal' && (
                                  <button
                                    onClick={() => handleConvertToDefect('measurement', `${m.name}: 测量值${m.value}${m.unit}, 标准值${m.standard}`)}
                                    className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 bg-red-50 rounded hover:bg-red-100 transition-colors"
                                  >
                                    转为缺陷
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedRecord.spareParts.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-800 mb-3">更换备件</h5>
                  <div className="space-y-2">
                    {selectedRecord.spareParts.map(part => (
                      <div key={part.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{part.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{part.partNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">
                            {part.usedQuantity || 0} / {part.quantity} {part.unit}
                          </p>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPartStatusColor(part.status)}`}>
                            {getPartStatusLabel(part.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.photos.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-800 mb-3">现场照片</h5>
                  <div className="grid grid-cols-4 gap-3">
                    {selectedRecord.photos.map((photo, idx) => (
                      <div key={idx} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <Layers size={24} className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecordDefects.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Shield size={16} className="text-red-500" />
                    关联缺陷
                  </h5>
                  <div className="space-y-2">
                    {selectedRecordDefects.map(d => (
                      <div
                        key={d.id}
                        className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-[#0D47A1] transition-colors"
                        onClick={() => {
                          setSelectedDefect(d);
                          setSelectedRecord(null);
                          setDefectResolution('');
                          setDefectVerifiedBy('');
                          setDefectVerifiedResult('');
                          setDefectFormAssignedTo('');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(d.severity)}`}>
                              {getSeverityLabel(d.severity)}
                            </span>
                            <span className="text-sm font-medium text-gray-800">{d.title}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDefectStatusColor(d.status)}`}>
                            {getDefectStatusLabel(d.status)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">来源: {getSourceTypeLabel(d.sourceType)} | 责任人: {d.assignedTo || '未分配'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedDefect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Shield size={18} className="text-red-500" />
                缺陷详情
              </h3>
              <button
                onClick={() => setSelectedDefect(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-lg">{selectedDefect.title}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(selectedDefect.severity)}`}>
                      {getSeverityLabel(selectedDefect.severity)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDefectStatusColor(selectedDefect.status)}`}>
                      {getDefectStatusLabel(selectedDefect.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">缺陷编号</p>
                  <p className="text-sm font-medium text-gray-800 font-mono">{selectedDefect.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">所属设备</p>
                  <p className="text-sm font-medium text-gray-800">{selectedDefect.equipmentName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">来源类型</p>
                  <p className="text-sm font-medium text-gray-800">{getSourceTypeLabel(selectedDefect.sourceType)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">责任人</p>
                  <p className="text-sm font-medium text-gray-800">{selectedDefect.assignedTo || '未分配'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">创建日期</p>
                  <p className="text-sm font-medium text-gray-800">{selectedDefect.createdDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">解决日期</p>
                  <p className="text-sm font-medium text-gray-800">{selectedDefect.resolvedDate || '-'}</p>
                </div>
              </div>

              {selectedDefect.description && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">缺陷描述</p>
                  <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedDefect.description}</p>
                </div>
              )}

              {selectedDefect.sourceDetail && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">来源详情</p>
                  <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedDefect.sourceDetail}</p>
                </div>
              )}

              {selectedDefect.resolution && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800">处理结果</p>
                  <p className="text-sm text-green-700 mt-1">{selectedDefect.resolution}</p>
                </div>
              )}

              {selectedDefect.verifiedResult && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-teal-800">验证结果</p>
                  <p className="text-sm text-teal-700 mt-1">{selectedDefect.verifiedResult}</p>
                  {selectedDefect.verifiedBy && (
                    <p className="text-xs text-teal-600 mt-1">验证人: {selectedDefect.verifiedBy} | 验证日期: {selectedDefect.verifiedDate}</p>
                  )}
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <GitBranch size={14} />
                  状态流转
                </p>
                <div className="flex items-center gap-1 flex-wrap">
                  {(['open', 'assigned', 'in_progress', 'resolved', 'verified', 'closed'] as DefectStatus[]).map((s, idx) => (
                    <React.Fragment key={s}>
                      {idx > 0 && <ArrowRight size={14} className="text-gray-300" />}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        s === selectedDefect.status
                          ? getDefectStatusColor(s) + ' ring-2 ring-offset-1 ring-gray-300'
                          : selectedDefect.status === 'closed' || ['closed', 'verified'].includes(selectedDefect.status) && ['resolved', 'verified', 'closed'].indexOf(s) <= ['resolved', 'verified', 'closed'].indexOf(selectedDefect.status)
                            ? 'bg-gray-200 text-gray-600'
                            : 'bg-gray-100 text-gray-400'
                      }`}>
                        {getDefectStatusLabel(s)}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {(selectedDefect.status === 'open' || selectedDefect.status === 'assigned' || selectedDefect.status === 'in_progress' || selectedDefect.status === 'resolved') && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <h5 className="font-medium text-gray-800 flex items-center gap-2">
                    <ArrowRight size={16} />
                    推进至: {getNextStatusLabel(selectedDefect.status)}
                  </h5>

                  {selectedDefect.status === 'open' && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">分配责任人</label>
                      <input
                        type="text"
                        value={defectFormAssignedTo}
                        onChange={(e) => setDefectFormAssignedTo(e.target.value)}
                        placeholder="请输入责任人姓名"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent text-sm"
                      />
                    </div>
                  )}

                  {selectedDefect.status === 'resolved' && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">验证人</label>
                        <input
                          type="text"
                          value={defectVerifiedBy}
                          onChange={(e) => setDefectVerifiedBy(e.target.value)}
                          placeholder="请输入验证人姓名"
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">验证结果</label>
                        <textarea
                          value={defectVerifiedResult}
                          onChange={(e) => setDefectVerifiedResult(e.target.value)}
                          placeholder="请输入验证结果"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent text-sm resize-none"
                        />
                      </div>
                    </>
                  )}

                  {(selectedDefect.status === 'in_progress') && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">处理结果</label>
                      <textarea
                        value={defectResolution}
                        onChange={(e) => setDefectResolution(e.target.value)}
                        placeholder="请输入处理结果"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent text-sm resize-none"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleAdvanceDefectStatus}
                    className="px-4 py-2 bg-[#0D47A1] text-white text-sm font-medium rounded-md hover:bg-[#0A3A84] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} />
                    确认推进至{getNextStatusLabel(selectedDefect.status)}
                  </button>
                </div>
              )}

              {selectedDefect.status === 'verified' && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h5 className="font-medium text-gray-800 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  确认关闭缺陷
                </h5>
                <p className="text-xs text-gray-500">
                  缺陷已验证合格，确认关闭后将从未关闭缺陷中移除
                </p>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">关闭人</label>
                  <input
                    type="text"
                    value={defectCloseOperator}
                    onChange={(e) => setDefectCloseOperator(e.target.value)}
                    placeholder="请输入关闭人姓名"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">关闭备注</label>
                  <textarea
                    value={defectCloseComment}
                    onChange={(e) => setDefectCloseComment(e.target.value)}
                    placeholder="请输入关闭备注（可选）"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent text-sm resize-none"
                  />
                </div>
                <button
                  onClick={handleCloseDefect}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle size={14} />
                  确认关闭
                </button>
              </div>
              )}

              {selectedDefect.actionLogs && selectedDefect.actionLogs.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-gray-500" />
                    操作日志
                  </h5>
                  <div className="space-y-3">
                    {selectedDefect.actionLogs.map((log, idx) => (
                      <div key={log.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full mt-1 ${
                            idx === 0 ? 'bg-blue-500' :
                            log.action === 'closed' ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          {idx < selectedDefect.actionLogs.length - 1 && (
                            <div className="w-0.5 flex-1 bg-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">
                            {getActionLabel(log.action)}
                          </span>
                          <span className="text-xs text-gray-500">{log.timestamp}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          操作人: {log.operator}</div>
                        {log.comment && (
                          <p className="text-xs text-gray-700 mt-1 bg-white p-2 rounded text-sm">
                            {log.comment}
                          </p>
                        )}
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDefectForm && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Plus size={18} />
                转为缺陷项
              </h3>
              <button
                onClick={() => setShowDefectForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">来源类型</label>
                <p className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded">
                  {getSourceTypeLabel(defectFormSource)}
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">来源详情</label>
                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{defectFormSourceDetail}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">缺陷标题 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={defectFormTitle}
                  onChange={(e) => setDefectFormTitle(e.target.value)}
                  placeholder="请输入缺陷标题"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">严重程度</label>
                <div className="flex gap-3">
                  {(['minor', 'major', 'critical'] as DefectSeverity[]).map(sev => (
                    <button
                      key={sev}
                      onClick={() => setDefectFormSeverity(sev)}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                        defectFormSeverity === sev
                          ? sev === 'minor' ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : sev === 'major' ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {getSeverityLabel(sev)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">责任人</label>
                <input
                  type="text"
                  value={defectFormAssignedTo}
                  onChange={(e) => setDefectFormAssignedTo(e.target.value)}
                  placeholder="请输入责任人姓名"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowDefectForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitDefect}
                  disabled={!defectFormTitle.trim()}
                  className="px-4 py-2 bg-[#0D47A1] text-white text-sm font-medium rounded-md hover:bg-[#0A3A84] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
