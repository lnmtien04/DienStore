'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import {
  EyeIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Log {
  _id: string;
  user: { fullName: string; email: string };
  action: string;
  targetType: string;
  targetId: string;
  changes?: any;
  ip: string;
  userAgent: string;
  timestamp: string;
  status?: 'success' | 'failure';
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    fromDate: '',
    toDate: '',
  });

  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Hàm gọi API lấy logs
  const fetchLogs = async (filtersToUse: typeof filters, pageToUse: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pageToUse.toString());
      params.append('limit', '20');
      if (filtersToUse.userId) params.append('userId', filtersToUse.userId);
      if (filtersToUse.action) params.append('action', filtersToUse.action);
      if (filtersToUse.fromDate) params.append('fromDate', filtersToUse.fromDate);
      if (filtersToUse.toDate) params.append('toDate', filtersToUse.toDate);

      const res = await axios.get(`${API_URL}/api/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data.logs || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      toast.error('Không thể tải nhật ký');
    } finally {
      setLoading(false);
    }
  };

  // Load logs lần đầu
  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchLogs(filters, page);
  }, []); // chỉ chạy một lần sau mount

  // Khi page thay đổi (phân trang)
  useEffect(() => {
    if (token) fetchLogs(filters, page);
  }, [page]);

  // Xử lý lọc
  const handleFilter = () => {
    setPage(1);
    fetchLogs(filters, 1);
  };

  // Xử lý reset bộ lọc
  const resetFilter = () => {
    const emptyFilters = { userId: '', action: '', fromDate: '', toDate: '' };
    setFilters(emptyFilters);
    setPage(1);
    fetchLogs(emptyFilters, 1);
  };

  // Làm mới (refresh)
  const handleRefresh = () => {
    fetchLogs(filters, page);
  };

  // Xuất Excel
  const handleExport = () => {
    if (logs.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }
    try {
      const exportData = logs.map((log) => ({
        'Thời gian': format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss'),
        'Người dùng': log.user?.fullName || 'N/A',
        'Email': log.user?.email || '',
        'Hành động (mã)': log.action,
        'Hành động (tên)': getActionText(log.action),
        'Đối tượng': log.targetType ? `${log.targetType} - ${log.targetId}` : '',
        'IP': log.ip,
        'Thiết bị': log.userAgent,
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Logs');
      XLSX.writeFile(wb, `activity_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
      toast.success('Xuất file thành công');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Xuất file thất bại');
    }
  };

  const viewDetail = (log: Log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const getActionText = (action: string) => {
    const map: Record<string, string> = {
      CREATE_PRODUCT: 'Thêm sản phẩm',
      UPDATE_PRODUCT: 'Cập nhật sản phẩm',
      DELETE_PRODUCT: 'Xóa sản phẩm',
      CREATE_ORDER: 'Tạo đơn hàng',
      UPDATE_ORDER: 'Cập nhật đơn hàng',
      UPDATE_ORDER_STATUS: 'Cập nhật trạng thái đơn',
      DELETE_ORDER: 'Xóa đơn hàng',
      CREATE_USER: 'Tạo người dùng',
      UPDATE_USER: 'Cập nhật người dùng',
      DELETE_USER: 'Xóa người dùng',
      LOGIN: 'Đăng nhập',
      LOGOUT: 'Đăng xuất',
    };
    return map[action] || action;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Nhật ký hoạt động</h1>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nhật ký hoạt động</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Theo dõi các hành động đã thực hiện trong hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Xuất Excel
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Người dùng
            </label>
            <input
              type="text"
              placeholder="Email hoặc tên"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Hành động
            </label>
            <input
              type="text"
              placeholder="Ví dụ: CREATE_PRODUCT"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleFilter}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <FunnelIcon className="w-4 h-4" />
              Lọc
            </button>
            <button
              onClick={resetFilter}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 flex items-center justify-center gap-2"
            >
              <XMarkIcon className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Bảng log */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Thời gian
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Người dùng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Hành động
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Đối tượng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  IP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Thiết bị
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.user?.fullName || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{log.user?.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs">
                      {getActionText(log.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {log.targetType && (
                      <>
                        {log.targetType} <span className="text-gray-400">({log.targetId})</span>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-700 dark:text-gray-300">
                    {log.ip}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-sm text-gray-700 dark:text-gray-300">
                    {log.userAgent}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => viewDetail(log)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && !loading && (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">Không có bản ghi nào</p>
        )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 dark:border-gray-600"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 dark:border-gray-600"
          >
            Sau
          </button>
        </div>
      )}

      {/* Modal chi tiết */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chi tiết hoạt động</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <span className="font-semibold">ID Log:</span> {selectedLog._id}
              </div>
              <div>
                <span className="font-semibold">Thời gian:</span>{' '}
                {format(new Date(selectedLog.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
              </div>
              <div>
                <span className="font-semibold">Người dùng:</span> {selectedLog.user?.fullName} (
                {selectedLog.user?.email})
              </div>
              <div>
                <span className="font-semibold">Hành động:</span> {getActionText(selectedLog.action)} (
                {selectedLog.action})
              </div>
              <div>
                <span className="font-semibold">Đối tượng:</span> {selectedLog.targetType} -{' '}
                {selectedLog.targetId}
              </div>
              <div>
                <span className="font-semibold">IP:</span> {selectedLog.ip}
              </div>
              <div>
                <span className="font-semibold">Thiết bị:</span> {selectedLog.userAgent}
              </div>
              {selectedLog.changes && (
                <div>
                  <span className="font-semibold">Thay đổi:</span>
                  <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-4 border-t dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}