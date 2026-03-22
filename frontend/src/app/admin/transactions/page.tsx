'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Transaction {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku: string;
  };
  type: 'import' | 'export' | 'adjustment' | 'audit';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  referenceType: 'order' | 'purchase' | 'audit' | 'manual';
  referenceId?: string;
  note?: string;
  createdBy: {
    _id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    productId: '',
    type: '',
    fromDate: '',
    toDate: '',
    userId: '',
    search: '',
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [products, setProducts] = useState<{ _id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ _id: string; fullName: string }[]>([]);

  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Lấy danh sách sản phẩm và người dùng cho dropdown lọc
  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchUsers();
    }
  }, [token]);

const fetchProducts = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Kiểm tra cấu trúc response
    let productsArray = [];
    if (Array.isArray(res.data)) {
      productsArray = res.data;
    } else if (res.data.products && Array.isArray(res.data.products)) {
      productsArray = res.data.products;
    }
    setProducts(productsArray.map((p: any) => ({ _id: p._id, name: p.name })));
  } catch (error) {
    console.error('Lỗi tải sản phẩm:', error);
  }
};

const fetchUsers = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    let usersArray = [];
    if (Array.isArray(res.data)) {
      usersArray = res.data;
    } else if (res.data.users && Array.isArray(res.data.users)) {
      usersArray = res.data.users;
    }
    setUsers(usersArray.map((u: any) => ({ _id: u._id, fullName: u.fullName })));
  } catch (error) {
    console.error('Lỗi tải người dùng:', error);
  }
};

  // Fetch transactions khi filters hoặc page thay đổi
  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchTransactions();
  }, [token, page, filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (filters.productId) params.append('productId', filters.productId);
      if (filters.type) params.append('type', filters.type);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.search) params.append('search', filters.search);

      const res = await axios.get(`${API_URL}/api/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data.transactions || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalItems(res.data.total || 0);
    } catch (error) {
      console.error('Lỗi tải lịch sử kho:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setPage(1);
    fetchTransactions();
  };

  const resetFilter = () => {
    setFilters({
      productId: '',
      type: '',
      fromDate: '',
      toDate: '',
      userId: '',
      search: '',
    });
    setPage(1);
    setTimeout(fetchTransactions, 100);
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      import: 'Nhập',
      export: 'Xuất',
      adjustment: 'Điều chỉnh',
      audit: 'Kiểm kê',
    };
    return map[type] || type;
  };

  const getTypeColor = (type: string) => {
    const map: Record<string, string> = {
      import: 'bg-green-100 text-green-700',
      export: 'bg-red-100 text-red-700',
      adjustment: 'bg-yellow-100 text-yellow-700',
      audit: 'bg-blue-100 text-blue-700',
    };
    return map[type] || 'bg-gray-100';
  };

  const getQuantityColor = (quantity: number) => {
    if (quantity > 0) return 'text-green-600 font-medium';
    if (quantity < 0) return 'text-red-600 font-medium';
    return '';
  };

  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Lịch sử kho hàng</h1>

      {/* Thanh tìm kiếm & nút lọc */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-60">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
        </div>
        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
        >
          <FunnelIcon className="w-5 h-5 text-slate-600" />
          Bộ lọc
        </button>
        {(filters.productId || filters.type || filters.fromDate || filters.toDate || filters.userId) && (
          <button
            onClick={resetFilter}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
          >
            <XMarkIcon className="w-5 h-5 text-slate-600" />
            Reset
          </button>
        )}
      </div>

      {/* Panel lọc nâng cao */}
      {showFilterPanel && (
        <div className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sản phẩm</label>
              <select
                value={filters.productId}
                onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="">Tất cả sản phẩm</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Loại giao dịch</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="">Tất cả</option>
                <option value="import">Nhập</option>
                <option value="export">Xuất</option>
                <option value="adjustment">Điều chỉnh</option>
                <option value="audit">Kiểm kê</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Từ ngày</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Đến ngày</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Người thực hiện</label>
              <select
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="">Tất cả</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.fullName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowFilterPanel(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Đóng
            </button>
            <button
              onClick={() => { setPage(1); fetchTransactions(); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Thời gian</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Sản phẩm</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Số lượng</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tồn sau</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nguồn</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Người thực hiện</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => {
                const quantity = t.type === 'export' ? -Math.abs(t.quantity) : t.quantity;
                const displayQuantity = quantity > 0 ? `+${quantity}` : quantity;
                return (
                  <tr key={t._id} className="hover:bg-blue-50/40 transition">
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {formatDateTime(t.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">{t.product?.name}</div>
                      <div className="text-xs text-slate-400">{t.product?.sku}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getTypeColor(t.type)}`}>
                        {getTypeLabel(t.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={getQuantityColor(quantity)}>{displayQuantity}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{t.stockAfter}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {t.referenceType === 'order' && t.referenceId ? (
                        <a href={`/admin/orders/${t.referenceId}`} className="text-blue-600 hover:underline">
                          Đơn #{t.referenceId}
                        </a>
                      ) : t.referenceId ? (
                        t.referenceId
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {t.createdBy?.fullName || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{t.note || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <p className="text-center py-8 text-slate-500">Không có giao dịch nào</p>
        )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            Hiển thị {(page - 1) * 20 + 1} - {Math.min(page * 20, totalItems)} / {totalItems} giao dịch
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