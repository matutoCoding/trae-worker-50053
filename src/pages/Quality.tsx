import React, { useState, useMemo } from 'react';
import { useQualityStore } from '@/store/qualityStore';
import { useEquipmentStore } from '@/store/equipmentStore';
import { DataCard } from '@/components/DataCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { QualityCheck } from '@/types';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  Eye,
  X,
  FileCheck,
  User,
  Calendar,
  FileText,
  ClipboardCheck,
  EyeOff,
  AlertCircle,
  BarChart3,
  CheckCheck,
  Eye as EyeIcon,
  RotateCcw
} from 'lucide-react';
import { formatDate } from '@/utils/date';
import { getCategoryLabel, getStatusLabel, getSeverityColor
} from '@/utils/format';

type TabMode = 'checks' | 'pending' | 'trend';
type FilterType = 'all' | string;
type FilterPoint = 'all' | string;
type FilterStatus = 'all' | string;

export const Quality: React.FC = () => {
  const {
    checks,
    trendData,
    getChecksByType,
    getChecksByPoint,
    getChecksByStatus,
    getPendingChecks,
    getStatistics,
    updateCheckStatus,
    updateCheckFields
  } = useQualityStore();

  const { maintenanceRecords } = useEquipmentStore();

  const statistics = useMemo(() => getStatistics(), [checks, getStatistics]);
  const pendingChecks = useMemo(() => getPendingChecks(), [checks, getPendingChecks]);
  const reworkChecks = useMemo(() => getChecksByStatus('rework'), [checks, getChecksByStatus]);

  const [activeTab, setActiveTab] = useState<TabMode>('checks');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [pointFilter, setPointFilter] = useState<FilterPoint>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCheck, setSelectedCheck] = useState<QualityCheck | null>(null);
  const [resultForm, setResultForm] = useState('');
  const [pendingAction, setPendingAction] = useState<'rework' | 'fail' | null>(null);
  const [relatedRecordId, setRelatedRecordId] = useState('');
  const [recheckCheck, setRecheckCheck] = useState<QualityCheck | null>(null);
  const [recheckResult, setRecheckResult] = useState('');

  const filteredChecks = useMemo(() => {
    return checks.filter(check => {
      const matchType = typeFilter === 'all' || check.type === typeFilter;
      const matchPoint = pointFilter === 'all' || check.point === pointFilter;
      const matchStatus = statusFilter === 'all' || check.status === statusFilter;
      const matchSearch = searchQuery === '' ||
        check.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        check.taskName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchPoint && matchStatus && matchSearch;
    });
  }, [checks, typeFilter, pointFilter, statusFilter, searchQuery]);

  const getCheckTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hidden: '隐蔽工程',
      witness: '见证点',
      review: '文件审查'
    };
    return labels[type] || type;
  };

  const getCheckTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      hidden: 'bg-purple-100 text-purple-700',
      witness: 'bg-blue-100 text-blue-700',
      review: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getPointColor = (point: string) => {
    const colors: Record<string, string> = {
      H: 'bg-red-100 text-red-700',
      W: 'bg-blue-100 text-blue-700',
      R: 'bg-gray-100 text-gray-700'
    };
    return colors[point] || 'bg-gray-100 text-gray-700';
  };

  const closeCheckModal = () => {
    setSelectedCheck(null);
    setResultForm('');
    setPendingAction(null);
    setRelatedRecordId('');
  };

  const handlePassCheck = () => {
    if (selectedCheck) {
      updateCheckStatus(selectedCheck.id, 'passed', resultForm || '检查合格，同意放行。');
      closeCheckModal();
    }
  };

  const handleFailCheck = () => {
    if (selectedCheck) {
      const record = maintenanceRecords.find(r => r.id === relatedRecordId);
      if (relatedRecordId && record) {
        updateCheckFields(selectedCheck.id, {
          equipmentId: record.equipmentId,
          maintenanceRecordId: record.id
        });
      }
      updateCheckStatus(selectedCheck.id, 'failed', resultForm || '检查不合格，需返工。');
      closeCheckModal();
    }
  };

  const handleReworkCheck = () => {
    if (selectedCheck) {
      const record = maintenanceRecords.find(r => r.id === relatedRecordId);
      if (relatedRecordId && record) {
        updateCheckFields(selectedCheck.id, {
          equipmentId: record.equipmentId,
          maintenanceRecordId: record.id
        });
      }
      updateCheckStatus(selectedCheck.id, 'rework', resultForm || '需返工处理后重新报验。');
      closeCheckModal();
    }
  };

  const handleRecheckPass = () => {
    if (recheckCheck) {
      updateCheckStatus(recheckCheck.id, 'passed', recheckResult || '复验合格，同意放行。');
      setRecheckCheck(null);
      setRecheckResult('');
    }
  };

  const handleRecheckFail = () => {
    if (recheckCheck) {
      updateCheckStatus(recheckCheck.id, 'failed', recheckResult || '复验不合格。');
      setRecheckCheck(null);
      setRecheckResult('');
    }
  };

  const maxTrendValue = Math.max(
    ...trendData.map(d => d.passed + d.failed + d.rework + (d.recheckPassed || 0)),
    1
  );

  const renderCheckCard = (check: QualityCheck, actionButton: React.ReactNode) => (
    <div
      key={check.id}
      className="border border-gray-200 rounded-lg p-4 hover:border-[#0D47A1] transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            check.type === 'hidden' ? 'bg-purple-100' :
            check.type === 'witness' ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            {check.type === 'hidden' ? (
              <EyeOff size={24} className="text-purple-600" />
            ) : check.type === 'witness' ? (
              <EyeIcon size={24} className="text-blue-600" />
            ) : (
              <FileText size={24} className="text-gray-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getPointColor(check.point)}`}>
                {check.point}
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${getCheckTypeColor(check.type)}`}>
                {getCheckTypeLabel(check.type)}
              </span>
              <StatusBadge status={check.status} />
              {check.status === 'passed' && (check.reworkCount || 0) > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-teal-100 text-teal-700">
                  复验通过
                </span>
              )}
              {(check.reworkCount || 0) > 0 && check.status === 'rework' && (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-700">
                  已返工 {check.reworkCount} 次
                </span>
              )}
            </div>
            <h4 className="font-medium text-gray-800 mt-2">{check.name}</h4>
            <p className="text-sm text-gray-500 mt-1">{check.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <User size={14} />
                {check.inspector}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {formatDate(check.checkDate)}
              </span>
              <span className="flex items-center gap-1">
                <FileText size={14} />
                {check.taskName}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {actionButton}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">验收标准</p>
        <p className="text-sm text-gray-800 mt-1">{check.standard}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">质量验收管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理隐蔽工程验收、质量见证点确认和质量控制</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <DataCard
          title="质量检查点"
          value={statistics.total}
          icon={ClipboardCheck}
          color="#0D47A1"
        />
        <DataCard
          title="已通过"
          value={statistics.passed}
          icon={CheckCircle}
          color="#10B981"
          trend={{ value: statistics.passRate, isUp: true, suffix: '%' }}
        />
        <DataCard
          title="待验收"
          value={pendingChecks.length}
          icon={Clock}
          color="#E65100"
        />
        <DataCard
          title="合格率"
          value={statistics.passRate}
          suffix="%"
          icon={CheckCheck}
          color="#8B5CF6"
        />
        <DataCard
          title="复验通过"
          value={statistics.recheckPassed}
          icon={RotateCcw}
          color="#0D9488"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'checks', label: '质量检查点', icon: FileCheck },
            { key: 'pending', label: '待验收项', icon: Clock },
            { key: 'trend', label: '质量趋势', icon: BarChart3 }
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
                {item.key === 'pending' && (pendingChecks.length + reworkChecks.length) > 0 && (
                  <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                    {pendingChecks.length + reworkChecks.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'checks' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索检查点名称或工序..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] bg-white"
                  >
                    <option value="all">全部类型</option>
                    <option value="hidden">隐蔽工程</option>
                    <option value="witness">见证点</option>
                    <option value="review">文件审查</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={pointFilter}
                    onChange={(e) => setPointFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] bg-white"
                  >
                    <option value="all">全部控制点</option>
                    <option value="H">H点 (停工待检)</option>
                    <option value="W">W点 (见证点)</option>
                    <option value="R">R点 (文件审查)</option>
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
                    <option value="pending">待验收</option>
                    <option value="in_progress">验收中</option>
                    <option value="passed">已通过</option>
                    <option value="failed">不通过</option>
                    <option value="rework">返工</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">控制点</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">所属工序</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">验收人员</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">验收日期</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">附件</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredChecks.map(check => (
                      <tr key={check.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getPointColor(check.point)}`}>
                            {check.point}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{check.name}</span>
                            {check.status === 'passed' && (check.reworkCount || 0) > 0 && (
                              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-teal-100 text-teal-700">
                                复验通过
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getCheckTypeColor(check.type)}`}>
                            {getCheckTypeLabel(check.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{check.taskName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{check.inspector}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(check.checkDate)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={check.status} />
                        </td>
                        <td className="px-4 py-3">
                          {check.attachments.length > 0 ? (
                            <span className="text-sm text-gray-600">{check.attachments.length} 个</span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setSelectedCheck(check);
                              setResultForm(check.result || '');
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
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingChecks.length === 0 && reworkChecks.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <CheckCircle size={48} className="mx-auto mb-4 text-green-300" />
                  <p>所有检查点均已完成验收</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingChecks.length > 0 && (
                    <>
                      {pendingChecks.length > 0 && reworkChecks.length > 0 && (
                        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">待验收</h4>
                      )}
                      {pendingChecks.map(check => renderCheckCard(check, (
                        <button
                          onClick={() => {
                            setSelectedCheck(check);
                            setResultForm('');
                          }}
                          className="px-4 py-2 bg-[#0D47A1] text-white text-sm rounded-md hover:bg-[#1565C0] transition-colors"
                        >
                          验收
                        </button>
                      )))}
                    </>
                  )}
                  {reworkChecks.length > 0 && (
                    <>
                      {pendingChecks.length > 0 && <div className="pt-2" />}
                      <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">返工待复验</h4>
                      {reworkChecks.map(check => renderCheckCard(check, (
                        <button
                          onClick={() => {
                            setRecheckCheck(check);
                            setRecheckResult('');
                          }}
                          className="px-4 py-2 bg-[#0D9488] text-white text-sm rounded-md hover:bg-[#0F766E] transition-colors flex items-center gap-1"
                        >
                          <RotateCcw size={14} />
                          复验
                        </button>
                      )))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'trend' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">质量验收趋势</h3>
                  <div className="flex items-end gap-2 h-64">
                    {trendData.map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col gap-0.5">
                          {item.failed > 0 && (
                            <div
                              className="w-full bg-red-500 rounded-t"
                              style={{ height: `${(item.failed / maxTrendValue) * 100}%`, minHeight: item.failed > 0 ? '8px' : 0 }}
                              title={`不通过: ${item.failed}`}
                            />
                          )}
                          {item.rework > 0 && (
                            <div
                              className="w-full bg-yellow-500"
                              style={{ height: `${(item.rework / maxTrendValue) * 100}%`, minHeight: item.rework > 0 ? '8px' : 0 }}
                              title={`返工: ${item.rework}`}
                            />
                          )}
                          {(item.recheckPassed || 0) > 0 && (
                            <div
                              className="w-full"
                              style={{ height: `${((item.recheckPassed || 0) / maxTrendValue) * 100}%`, minHeight: (item.recheckPassed || 0) > 0 ? '8px' : 0, backgroundColor: '#0D9488' }}
                              title={`复验通过: ${item.recheckPassed || 0}`}
                            />
                          )}
                          {item.passed > 0 && (
                            <div
                              className="w-full bg-green-500 rounded-b"
                              style={{ height: `${(item.passed / maxTrendValue) * 100}%`, minHeight: item.passed > 0 ? '8px' : 0 }}
                              title={`首次通过: ${item.passed}`}
                            />
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{item.date}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded" />
                      <span className="text-sm text-gray-600">首次通过</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#0D9488' }} />
                      <span className="text-sm text-gray-600">复验通过</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded" />
                      <span className="text-sm text-gray-600">返工</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded" />
                      <span className="text-sm text-gray-600">不通过</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">质量统计</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">一次验收合格率</span>
                        <span className="text-lg font-bold text-green-600">{statistics.passRate}%</span>
                      </div>
                      <ProgressBar
                        value={statistics.passRate}
                        color="#10B981"
                        height="8px"
                        showLabel={false}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">总检查点</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{statistics.total}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">已通过</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{statistics.passed}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">待验收</p>
                        <p className="text-2xl font-bold text-orange-600 mt-1">{statistics.pending}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">验收中</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{statistics.inProgress}</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">平均验收处理时间</p>
                      <p className="text-xl font-bold text-gray-800 mt-1">{statistics.avgProcessTime} 天</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {['hidden', 'witness', 'review'].map(type => {
                  const typeChecks = getChecksByType(type);
                  const passed = typeChecks.filter(c => c.status === 'passed').length;
                  const rate = typeChecks.length > 0 ? Math.round((passed / typeChecks.length) * 100) : 0;
                  return (
                    <div key={type} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCheckTypeColor(type)}`}>
                          {type === 'hidden' ? (
                            <EyeOff size={20} />
                          ) : type === 'witness' ? (
                            <EyeIcon size={20} />
                          ) : (
                            <FileText size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{getCheckTypeLabel(type)}</p>
                          <p className="text-xs text-gray-500">{typeChecks.length} 个检查点</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">合格率</span>
                          <span className="font-medium text-gray-800">{rate}%</span>
                        </div>
                        <ProgressBar
                          value={rate}
                          height="6px"
                          showLabel={false}
                          color={rate >= 95 ? '#10B981' : rate >= 85 ? '#E65100' : '#EF4444'}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getPointColor(selectedCheck.point)}`}>
                  {selectedCheck.point}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-800">{selectedCheck.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getCheckTypeColor(selectedCheck.type)}`}>
                      {getCheckTypeLabel(selectedCheck.type)}
                    </span>
                    <StatusBadge status={selectedCheck.status} />
                    {(selectedCheck.reworkCount || 0) > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-700">
                        已返工 {selectedCheck.reworkCount} 次
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={closeCheckModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">所属工序</p>
                  <p className="text-sm font-medium text-gray-800">{selectedCheck.taskName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">验收人员</p>
                  <p className="text-sm font-medium text-gray-800">{selectedCheck.inspector}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">验收日期</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(selectedCheck.checkDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">状态</p>
                  <StatusBadge status={selectedCheck.status} />
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">检查描述</p>
                <p className="text-sm text-gray-800 mt-1">{selectedCheck.description}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">验收标准</p>
                <p className="text-sm text-gray-800 mt-1">{selectedCheck.standard}</p>
              </div>

              {selectedCheck.result && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-gray-500">验收结果</p>
                  <p className="text-sm text-gray-800 mt-1">{selectedCheck.result}</p>
                </div>
              )}

              {selectedCheck.attachments.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">相关附件</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCheck.attachments.map((att, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded text-sm text-gray-600">
                        <FileText size={14} />
                        {att}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(selectedCheck.status === 'pending' || selectedCheck.status === 'in_progress') && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-800 mb-2">验收结论</p>
                  <textarea
                    value={resultForm}
                    onChange={(e) => setResultForm(e.target.value)}
                    placeholder="请填写验收结论..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] resize-none"
                    rows={3}
                  />

                  {pendingAction && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                      <p className="text-sm font-medium text-gray-700">
                        关联设备/检修记录
                        <span className="text-xs text-gray-400 ml-1">（可选）</span>
                      </p>
                      <select
                        value={relatedRecordId}
                        onChange={(e) => setRelatedRecordId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] bg-white"
                      >
                        <option value="">不关联</option>
                        {maintenanceRecords.map(record => (
                          <option key={record.id} value={record.id}>
                            {record.equipmentName} - {record.type} ({record.id.slice(-6)})
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            if (pendingAction === 'rework') handleReworkCheck();
                            else if (pendingAction === 'fail') handleFailCheck();
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-md transition-colors ${
                            pendingAction === 'rework'
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {pendingAction === 'rework' ? (
                            <>
                              <AlertCircle size={16} />
                              确认返工
                            </>
                          ) : (
                            <>
                              <XCircle size={16} />
                              确认不通过
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setPendingAction(null);
                            setRelatedRecordId('');
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  {!pendingAction && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handlePassCheck}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle size={16} />
                        验收通过
                      </button>
                      <button
                        onClick={() => setPendingAction('rework')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                      >
                        <AlertCircle size={16} />
                        需要返工
                      </button>
                      <button
                        onClick={() => setPendingAction('fail')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        <XCircle size={16} />
                        不通过
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {recheckCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-100">
                  <RotateCcw size={20} className="text-teal-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">复验</h3>
                  <p className="text-sm text-gray-500">{recheckCheck.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setRecheckCheck(null);
                  setRecheckResult('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    该检查点已返工 {recheckCheck.reworkCount || 0} 次，请进行复验
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 mb-2">复验结论</p>
                <textarea
                  value={recheckResult}
                  onChange={(e) => setRecheckResult(e.target.value)}
                  placeholder="请填写复验结论..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRecheckPass}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                  style={{ backgroundColor: '#0D9488' }}
                >
                  <CheckCircle size={16} />
                  复验通过
                </button>
                <button
                  onClick={handleRecheckFail}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <XCircle size={16} />
                  复验不通过
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
