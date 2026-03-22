'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Order {
  _id: string;
  orderNumber: string;
  user: { fullName: string; email: string; phoneNumber: string };
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchOrders();
  }, [page, statusFilter, search, token]);

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', '10');
      const res = await axios.get(`${API_URL}/api/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalItems(res.data.total || 0);
      setSelectedOrders([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn');
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) return;
    try {
      await axios.delete(`${API_URL}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Xóa đơn hàng thành công');
      fetchOrders();
    } catch (error) {
      console.error('Lỗi xóa đơn hàng:', error);
      toast.error('Xóa đơn hàng thất bại');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;
    if (!confirm(`Xóa ${selectedOrders.length} đơn hàng?`)) return;
    try {
      await Promise.all(
        selectedOrders.map((id) =>
          axios.delete(`${API_URL}/api/orders/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      toast.success(`Đã xóa ${selectedOrders.length} đơn hàng`);
      fetchOrders();
    } catch (error) {
      console.error('Lỗi xóa hàng loạt:', error);
      toast.error('Xóa thất bại');
    }
  };

  const handleExportExcel = () => {
    if (orders.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }
    // Tạo CSV đơn giản
    const csvContent = [
      ['Mã đơn', 'Khách hàng', 'SĐT', 'Tổng tiền', 'Trạng thái', 'Thanh toán', 'Ngày tạo'],
      ...orders.map((o) => [
        o.orderNumber,
        o.user?.fullName || '',
        o.user?.phoneNumber || '',
        o.totalAmount.toString(),
        o.orderStatus,
        o.paymentStatus,
        new Date(o.createdAt).toLocaleDateString('vi-VN'),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success('Xuất file thành công');
  };

  const handleImportExcel = () => {
    toast('Chức năng nhập Excel đang phát triển', { icon: '🚧' });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o._id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelect = (id: string) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter((i) => i !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-600' },
      shipping: { bg: 'bg-purple-100', text: 'text-purple-600' },
      delivered: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-600' },
    };
    const labels: Record<string, string> = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
    };
    const { bg, text } = colors[status] || { bg: 'bg-gray-100', text: 'text-gray-600' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div className="p-4 min-h-screen bg-slate-50">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* Header + Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý đơn hàng</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleImportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-100 transition"
          >
            <DocumentArrowUpIcon className="w-4 h-4" />
            Nhập Excel
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Xuất Excel
          </button>
          <Link
            href="/admin/orders/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Thêm mới
          </Link>
        </div>
      </div>

      {/* Thanh tìm kiếm và lọc */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-60">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm theo mã đơn, tên khách..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            </div>
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            <FunnelIcon className="w-4 h-4 text-slate-600" />
            Lọc nâng cao
          </button>
          {selectedOrders.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100"
            >
              <TrashIcon className="w-4 h-4" />
              Xóa đã chọn ({selectedOrders.length})
            </button>
          )}
        </div>

        {/* Panel lọc nâng cao */}
        {showFilter && (
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-700">Bộ lọc nâng cao</h3>
              <button onClick={() => setShowFilter(false)}>
                <XMarkIcon className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="shipping">Đang giao</option>
                <option value="delivered">Đã giao</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bảng đơn hàng */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Mã đơn
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Thanh toán
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-blue-50/40 transition">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => toggleSelect(order._id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    <div>{order.user?.fullName || 'N/A'}</div>
                    <div className="text-xs text-slate-400">{order.user?.phoneNumber || ''}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-900">
                    {order.totalAmount?.toLocaleString()}đ
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(order.orderStatus)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="text-slate-600">
                      {order.paymentMethod === 'cod' ? 'COD' : 'Chuyển khoản'}
                    </span>
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        order.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-yellow-100 text-yellow-600'
                      }`}
                    >
                      {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa TT'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/orders/${order._id}`}>
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded-md" title="Xem chi tiết">
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </Link>
                      <Link href={`/admin/orders/edit/${order._id}`}>
                        <button className="p-1 text-green-600 hover:bg-green-50 rounded-md" title="Sửa">
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDeleteOrder(order._id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded-md"
                        title="Xóa"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <p className="text-center py-8 text-slate-500">Không có đơn hàng nào</p>
        )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            Hiển thị {orders.length} / {totalItems} đơn hàng
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                    page === p
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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