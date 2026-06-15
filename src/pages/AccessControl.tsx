import React, { useState, useMemo } from 'react';
import { useWorkerStore } from '@/store/workerStore';
import { DataCard } from '@/components/DataCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { Worker, Certificate } from '@/types';
import {
  Users,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Shield,
  Phone,
  Building,
  UserCheck,
  X,
  Eye,
  FileCheck,
  AlertCircle,
  ShieldAlert,
  Calendar,
  User,
  Briefcase
} from 'lucide-react';
import { formatDate } from '@/utils/date';
import { getStatusLabel, getCertificateStatusLabel, getSeverityColor
} from '@/utils/format';

type TabMode = 'workers' | 'applications' | 'alerts';
type FilterDepartment = 'all' | string;
type FilterStatus = 'all' | string;

export const AccessControl: React.FC = () => {
  const {
    workers,
    accessApplications,
    getWorkersWithExpiringCerts,
    approveAccess,
    rejectAccess
  } = useWorkerStore();

  const [activeTab, setActiveTab] = useState<TabMode>('workers');
  const [departmentFilter, setDepartmentFilter] = useState<FilterDepartment>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<typeof accessApplications[0] | null>(null);

  const departments = useMemo(() => {
    const deps = new Set(workers.map(w => w.department));
    return ['all', ...Array.from(deps)];
  }, [workers]);

  const filteredWorkers = useMemo(() => {
    return workers.filter(worker => {
      const matchDepartment = departmentFilter === 'all' || worker.department === departmentFilter;
      const matchStatus = statusFilter === 'all' || worker.status === statusFilter;
      const matchSearch = searchQuery === '' ||
        worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.position.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDepartment && matchStatus && matchSearch;
    });
  }, [workers, departmentFilter, statusFilter, searchQuery]);

  const expiringWorkers = getWorkersWithExpiringCerts();
  const onSiteWorkers = workers.filter(w => w.status === 'on_site');
  const pendingApplications = accessApplications.filter(a => a.status === 'pending');

  const getCertificateStatusColor = (status: Certificate['status']) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-700';
      case 'expiring':
        return 'bg-yellow-100 text-yellow-700';
      case 'expired':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDaysUntilExpiry = (expireDate: string) => {
    const expiry = new Date(expireDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleApprove = (appId: string) => {
    approveAccess(appId, '当前用户');
  };

  const handleReject = (appId: string) => {
    rejectAccess(appId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">人员准入管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理检修人员资质审查与准入控制</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <DataCard
          title="总人数"
          value={workers.length}
          icon={Users}
          color="#0D47A1"
        />
        <DataCard
          title="在场人员"
          value={onSiteWorkers.length}
          icon={UserCheck}
          color="#10B981"
        />
        <DataCard
          title="证书临期"
          value={expiringWorkers.length}
          icon={AlertTriangle}
          color="#E65100"
        />
        <DataCard
          title="待审批"
          value={pendingApplications.length}
          icon={Clock}
          color="#EF4444"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'workers', label: '人员名录', icon: Users },
            { key: 'applications', label: '准入申请', icon: FileCheck },
            { key: 'alerts', label: '资质预警', icon: ShieldAlert }
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
                {item.key === 'applications' && pendingApplications.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {pendingApplications.length}
                  </span>
                )}
                {item.key === 'alerts' && expiringWorkers.length > 0 && (
                  <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                    {expiringWorkers.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {activeTab === 'workers' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索人员姓名或职位..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D47A1] bg-white"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>
                        {dept === 'all' ? '全部部门' : dept}
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
                    <option value="available">空闲</option>
                    <option value="on_site">在场</option>
                    <option value="training">培训中</option>
                    <option value="unavailable">不可用</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4">
                {filteredWorkers.map(worker => (
                  <div
                    key={worker.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-[#0D47A1] transition-colors cursor-pointer"
                    onClick={() => setSelectedWorker(worker)}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={worker.avatar}
                        alt={worker.name}
                        className="w-12 h-12 rounded-full bg-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 truncate">{worker.name}</span>
                          {worker.certificates.some(c => c.status === 'expired') && (
                            <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                          )}
                          {worker.certificates.some(c => c.status === 'expiring') && !worker.certificates.some(c => c.status === 'expired') && (
                            <AlertCircle size={14} className="text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{worker.position}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={worker.status} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Award size={12} />
                        <span>{worker.certificates.length} 个证书</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield size={12} />
                        <span>{worker.currentDose.toFixed(2)} mSv</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>年剂量</span>
                        <span>{worker.currentDose.toFixed(1)}/{worker.annualDoseLimit} mSv</span>
                      </div>
                      <ProgressBar
                        value={(worker.currentDose / worker.annualDoseLimit) * 100}
                        height="4px"
                        showLabel={false}
                        color={worker.currentDose > 15 ? '#EF4444' : worker.currentDose > 10 ? '#E65100' : '#10B981'}
                      />
                    </div>
                  </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-4">
              {accessApplications.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <FileCheck size={48} className="mx-auto mb-4 text-gray-300" />
                <p>暂无准入申请</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部门</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请日期</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工作区域</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工作内容</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预计工期</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">审批人</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {accessApplications.map(app => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            <span className="font-medium text-gray-800">{app.workerName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{app.department}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{app.applyDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{app.workArea}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{app.workContent}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{app.expectedDuration}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            app.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : app.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {app.status === 'pending' ? '待审批' : app.status === 'approved' ? '已批准' : '已拒绝'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{app.approver || '-'}</td>
                        <td className="px-4 py-3">
                          {app.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(app.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="批准"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleReject(app.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="拒绝"
                              >
                                <XCircle size={18} />
                              </button>
                              <button
                                onClick={() => setSelectedApplication(app)}
                                className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                title="查看详情"
                              >
                                <Eye size={18} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedApplication(app)}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                              title="查看详情"
                            >
                              <Eye size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {expiringWorkers.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <ShieldAlert size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>暂无资质预警信息</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringWorkers.map(worker => (
                  <div
                    key={worker.id}
                    className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <img
                      src={worker.avatar}
                      alt={worker.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{worker.name}</span>
                        <span className="text-sm text-gray-500">{worker.position}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {worker.certificates.filter(c => c.status !== 'valid').map(cert => {
                          const days = getDaysUntilExpiry(cert.expireDate);
                          return (
                            <span
                              key={cert.id}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                cert.status === 'expired'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {cert.type}
                              {cert.status === 'expired'
                                ? `已过期 ${Math.abs(days)} 天`
                                : `还有 ${days} 天过期`}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">联系电话</p>
                      <p className="text-sm font-medium text-gray-800">{worker.phone}</p>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">人员详情</h3>
              <button
                onClick={() => setSelectedWorker(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-6">
                <img
                  src={selectedWorker.avatar}
                  alt={selectedWorker.name}
                  className="w-20 h-20 rounded-full bg-gray-200"
                />
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-800">{selectedWorker.name}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Briefcase size={14} />
                      <span>{selectedWorker.position}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Building size={14} />
                      <span>{selectedWorker.department}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Phone size={14} />
                      <span>{selectedWorker.phone}</span>
                    </div>
                    <StatusBadge status={selectedWorker.status} />
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-gray-800 mb-3">辐射剂量</h5>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">年度剂量</span>
                    <span className="text-sm font-medium text-gray-800">
                    {selectedWorker.currentDose.toFixed(2)} / {selectedWorker.annualDoseLimit} mSv
                    </span>
                  </div>
                  <ProgressBar
                    value={(selectedWorker.currentDose / selectedWorker.annualDoseLimit) * 100}
                    color={selectedWorker.currentDose > 15 ? '#EF4444' : selectedWorker.currentDose > 10 ? '#E65100' : '#10B981'}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>已使用 {((selectedWorker.currentDose / selectedWorker.annualDoseLimit) * 100).toFixed(1)}%</span>
                    <span>剩余 {(selectedWorker.annualDoseLimit - selectedWorker.currentDose).toFixed(2)} mSv</span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-gray-800 mb-3">资质证书</h5>
                <div className="space-y-3">
                  {selectedWorker.certificates.map(cert => {
                    const days = getDaysUntilExpiry(cert.expireDate);
                    return (
                      <div
                        key={cert.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center`}>
                            <Award size={20} className="text-[#0D47A1]" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{cert.type}</p>
                            <p className="text-xs text-gray-500">
                              颁发日期: {formatDate(cert.issueDate)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            getCertificateStatusColor(cert.status)
                          }`}>
                            {getCertificateStatusLabel(cert.status)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">有效期至: {formatDate(cert.expireDate)}</p>
                          {cert.status !== 'valid' && (
                            <p className={`text-xs mt-1 ${cert.status === 'expired' ? 'text-red-600' : 'text-yellow-600'}`}>
                              {cert.status === 'expired'
                                ? `已过期 ${Math.abs(days)} 天`
                                : `还有 ${days} 天过期`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">准入申请详情</h3>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">申请人</p>
                  <p className="text-sm font-medium text-gray-800">{selectedApplication.workerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">部门</p>
                  <p className="text-sm font-medium text-gray-800">{selectedApplication.department}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">申请日期</p>
                  <p className="text-sm font-medium text-gray-800">{selectedApplication.applyDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">状态</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    selectedApplication.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : selectedApplication.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedApplication.status === 'pending' ? '待审批' : selectedApplication.status === 'approved' ? '已批准' : '已拒绝'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">工作区域</p>
                <p className="text-sm font-medium text-gray-800">{selectedApplication.workArea}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">工作内容</p>
                <p className="text-sm text-gray-800">{selectedApplication.workContent}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">预计工期</p>
                <p className="text-sm font-medium text-gray-800">{selectedApplication.expectedDuration}</p>
              </div>
              {selectedApplication.approver && (
                <div>
                  <p className="text-xs text-gray-500">审批人</p>
                  <p className="text-sm font-medium text-gray-800">{selectedApplication.approver}</p>
                </div>
              )}
              {selectedApplication.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleApprove(selectedApplication.id);
                      setSelectedApplication(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle size={16} />
                    批准
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedApplication.id);
                      setSelectedApplication(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <XCircle size={16} />
                    拒绝
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
