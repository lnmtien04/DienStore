'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Audit {
  _id: string;
  code: string;
  warehouse: string;
  items: any[];
  status: 'draft' | 'completed' | 'cancelled';
  totalDifference: number;
  createdBy: { fullName: string };
  createdAt: string;
}

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    fromDate: '',
    toDate: '',
  });
  const [showFilter, setShowFilter] = useState(false);

  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (token) fetchAudits();
  }, [token, page, filters]);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (filters.status) params.append('status', filters.status);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);

      const res = await axios.get(`${API_URL}/api/audits?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAudits(res.data.audits || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      toast.error('Không thể tải danh sách kiểm kê');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setPage(1);
    fetchAudits();
  };

  const resetFilter = () => {
    setFilters({ status: '', fromDate: '', toDate: '' });
    setPage(1);
    setTimeout(fetchAudits, 100);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      draft: 'Nháp',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading && audits.length === 0) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý kiểm kê</h1>
        <Link
          href="/admin/audits/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          Tạo kiểm kê
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
        >
          <FunnelIcon className="w-4 h-4" />
          Bộ lọc
        </button>
        {(filters.status || filters.fromDate || filters.toDate) && (
          <button
            onClick={resetFilter}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
          >
            <XMarkIcon className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      {showFilter && (
        <div className="bg-white rounded-lg p-4 mb-4 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="draft">Nháp</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg"
              placeholder="Từ ngày"
            />
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg"
              placeholder="Đến ngày"
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleFilter}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã kiểm kê</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kho</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Số SP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ngày tạo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Người tạo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {audits.map((audit) => (
                <tr key={audit._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{audit.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{audit.warehouse}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{audit.items.length}</td>
                  <td className="px-4 py-3">{getStatusBadge(audit.status)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(audit.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{audit.createdBy?.fullName || '-'}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/audits/${audit._id}`}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded inline-block"
                      title="Xem chi tiết"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </Link>
                    {audit.status === 'draft' && (
                      <Link
                        href={`/admin/audits/edit/${audit._id}`}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded inline-block ml-1"
                        title="Sửa"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {audits.length === 0 && (
          <p className="text-center py-8 text-slate-500">Không có phiếu kiểm kê nào</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded ${page === p ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}