import React, { useState, useMemo } from 'react';
import { useEquipmentStore } from '@/store/equipmentStore';
import { DataCard } from '@/components/DataCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { Equipment, MaintenanceRecord } from '@/types';
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
  Settings
} from 'lucide-react';
import { formatDate } from '@/utils/date';
import { getMaintenanceTypeLabel, getStatusLabel
} from '@/utils/format';

type TabMode = 'equipment' | 'records' | 'spareparts';
type FilterSystem = 'all' | string;
type FilterStatus = 'all' | string;

export const Maintenance: React.FC = () => {
  const {
    equipment,
    maintenanceRecords,
    getEquipmentBySystem,
    getEquipmentByStatus,
    getRecordsByEquipment,
    updateMaintenanceRecord
  } = useEquipmentStore();

  const [activeTab, setActiveTab] = useState<TabMode>('equipment');
  const [systemFilter, setSystemFilter] = useState<FilterSystem>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

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

  const selectedEquipmentRecords = useMemo(() => {
    if (!selectedEquipment) return [];
    return getRecordsByEquipment(selectedEquipment.id);
  }, [selectedEquipment, getRecordsByEquipment]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">设备检修管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理设备解体检修、备件更换和质量检查</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
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
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'equipment', label: '设备台账', icon: Cog },
            { key: 'records', label: '检修记录', icon: FileText },
            { key: 'spareparts', label: '备件管理', icon: Package }
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
                {filteredEquipment.map(eq => (
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
                  </div>
                ))}
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
                    <div>
                      <p className="text-sm font-medium text-yellow-800">检查发现</p>
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedRecord.measurements.map((m, idx) => {
                          const isWithinRange = m.value !== '' && m.standard !== '';
                          return (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-sm text-gray-800">{m.name}</td>
                              <td className="px-3 py-2 text-sm font-medium text-gray-800">{m.value}</td>
                              <td className="px-3 py-2 text-sm text-gray-600">{m.unit}</td>
                              <td className="px-3 py-2 text-sm text-gray-600">{m.standard}</td>
                              <td className="px-3 py-2">
                                {isWithinRange ? (
                                  <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                                    <CheckCircle size={14} />
                                    合格
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-red-600 text-sm">
                                    <AlertTriangle size={14} />
                                    异常
                                  </span>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
