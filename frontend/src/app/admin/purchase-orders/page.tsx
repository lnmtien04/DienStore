'use client';

import { useState, useEffect, useCallback } from 'react';
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
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface PurchaseOrder {
  _id: string;
  code: string;
  supplier: { _id: string; name: string };
  supplierName: string;
  items: any[];
  totalAmount: number;
  status: 'draft' | 'approved' | 'cancelled';
  createdAt: string;
}

interface Supplier {
  _id: string;
  name: string;
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    supplier: '',
    fromDate: '',
    toDate: '',
  });
  const [showFilter, setShowFilter] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Fetch suppliers một lần khi token có
  useEffect(() => {
    if (token) {
      fetchSuppliers();
    }
  }, [token]);

  // Fetch orders khi token, page, filters thay đổi
  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token, page, filters]);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/suppliers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(res.data);
    } catch (error) {
      console.error('Lỗi tải nhà cung cấp:', error);
      toast.error('Không thể tải danh sách nhà cung cấp');
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (filters.status) params.append('status', filters.status);
      if (filters.supplier) params.append('supplier', filters.supplier);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);

      const res = await axios.get(`${API_URL}/api/purchase-orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalItems(res.data.total || 0);
    } catch (error: any) {
      console.error('Lỗi tải phiếu nhập:', error);
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        // Có thể redirect về login ở đây nếu muốn
      } else {
        toast.error('Không thể tải phiếu nhập');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setPage(1);
    // fetchOrders sẽ tự động chạy do dependency thay đổi
  };

  const resetFilter = () => {
    setFilters({ status: '', supplier: '', fromDate: '', toDate: '' });
    setPage(1);
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Xác nhận duyệt phiếu nhập? Hành động này sẽ cập nhật tồn kho và không thể hoàn tác.'))
      return;
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/api/purchase-orders/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Đã duyệt phiếu');
      fetchOrders(); // refresh danh sách
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Duyệt thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Hủy phiếu nhập?')) return;
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/api/purchase-orders/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Đã hủy phiếu');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Hủy thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      approved: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      draft: 'Nháp',
      approved: 'Đã duyệt',
      cancelled: 'Đã hủy',
    };
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Phiếu nhập</h1>
        <Link
          href="/admin/purchase-orders/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <PlusIcon className="w-5 h-5" />
          Tạo phiếu nhập
        </Link>
      </div>

      {/* Thanh lọc */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition"
        >
          <FunnelIcon className="w-4 h-4" />
          Bộ lọc
        </button>
        {(filters.status || filters.supplier || filters.fromDate || filters.toDate) && (
          <button
            onClick={resetFilter}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition"
          >
            <XMarkIcon className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      {showFilter && (
        <div className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="draft">Nháp</option>
              <option value="approved">Đã duyệt</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <select
              value={filters.supplier}
              onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả nhà cung cấp</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleFilter}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Bảng */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mã phiếu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nhà cung cấp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Số SP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng tiền</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-blue-50/40 transition">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{order.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{order.supplier?.name || order.supplierName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{order.items.length}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 font-medium">{order.totalAmount.toLocaleString()}đ</td>
                  <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/purchase-orders/${order._id}`}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Xem chi tiết"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                      {order.status === 'draft' && (
                        <>
                          <Link
                            href={`/admin/purchase-orders/edit/${order._id}`}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Sửa"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleApprove(order._id)}
                            disabled={actionLoading}
                            className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                            title="Duyệt"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleCancel(order._id)}
                            disabled={actionLoading}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Hủy"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <p className="text-center py-8 text-slate-500">Không có phiếu nhập nào</p>
        )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            Hiển thị {(page - 1) * 10 + 1} - {Math.min(page * 10, totalItems)} / {totalItems} phiếu
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50"
            >
              Trước
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 5 && page > 3) {
                p = page - 3 + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded-lg ${
                    page === p ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}