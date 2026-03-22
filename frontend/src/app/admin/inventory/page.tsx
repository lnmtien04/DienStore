'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  minStock?: number;
  images: string[];
  category?: { name: string };
  brand?: { name: string };
}

interface Transaction {
  _id: string;
  product_variant_id?: { name: string; sku: string } | string;
  type: 'import' | 'export' | 'adjust';
  quantity: number;
  note?: string;
  created_by?: { fullName: string };
  created_at: string;
  related_order?: string;
}

interface Stats {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    stockStatus: '',
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Lấy danh sách danh mục và thương hiệu cho filter
  useEffect(() => {
    if (token) {
      fetchCategoriesAndBrands();
    }
  }, [token]);

  const fetchCategoriesAndBrands = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        axios.get(`${API_URL}/api/categories`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/brands`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setCategories(catRes.data.map((c: any) => c.name));
      setBrands(brandRes.data.map((b: any) => b.name));
    } catch (error) {
      console.error('Lỗi tải danh mục/thương hiệu:', error);
    }
  };

  // Fetch dữ liệu chính
  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchInventoryData();
    fetchStats();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactions();
    }
  }, [activeTab]);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Lỗi tải tồn kho:', error);
      toast.error('Không thể tải tồn kho');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/inventory/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (error) {
      console.error('Lỗi tải thống kê:', error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/inventory/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Lỗi tải lịch sử giao dịch:', error);
      toast.error('Không thể tải lịch sử');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setActionLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/inventory/import`,
        { productId: selectedProduct._id, quantity, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Nhập kho thành công');
      setShowImportModal(false);
      resetModal();
      fetchInventoryData();
      fetchStats();
      if (activeTab === 'history') fetchTransactions();
    } catch (error: any) {
      console.error('Lỗi nhập kho:', error);
      toast.error(error.response?.data?.message || 'Nhập kho thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (quantity > selectedProduct.stock) {
      toast.error('Số lượng xuất vượt quá tồn kho');
      return;
    }
    setActionLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/inventory/export`,
        { productId: selectedProduct._id, quantity, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Xuất kho thành công');
      setShowExportModal(false);
      resetModal();
      fetchInventoryData();
      fetchStats();
      if (activeTab === 'history') fetchTransactions();
    } catch (error: any) {
      console.error('Lỗi xuất kho:', error);
      toast.error(error.response?.data?.message || 'Xuất kho thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setActionLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/inventory/adjust`,
        { productId: selectedProduct._id, newStock: quantity, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Điều chỉnh tồn kho thành công');
      setShowAdjustModal(false);
      resetModal();
      fetchInventoryData();
      fetchStats();
      if (activeTab === 'history') fetchTransactions();
    } catch (error: any) {
      console.error('Lỗi điều chỉnh:', error);
      toast.error(error.response?.data?.message || 'Điều chỉnh thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const resetModal = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setNote('');
  };

  // Lọc sản phẩm
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.sku?.toLowerCase().includes(search.toLowerCase()) ||
                          p.name.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (filters.category && p.category?.name !== filters.category) return false;
      if (filters.brand && p.brand?.name !== filters.brand) return false;
      if (filters.stockStatus === 'low') return (p.minStock && p.stock <= p.minStock);
      if (filters.stockStatus === 'out') return p.stock === 0;
      return true;
    });
  }, [products, search, filters]);

  // Lọc giao dịch
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const productName = typeof t.product_variant_id === 'object'
        ? t.product_variant_id?.name || ''
        : t.product_variant_id || '';
      return productName.toLowerCase().includes(search.toLowerCase());
    });
  }, [transactions, search]);

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { label: 'Hết hàng', color: 'bg-red-100 text-red-800' };
    if (product.minStock && product.stock <= product.minStock) return { label: 'Sắp hết hàng', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Còn hàng', color: 'bg-green-100 text-green-800' };
  };

  const getTypeInfo = (type: string) => {
    const map: Record<string, { text: string; className: string }> = {
      import: { text: 'Nhập kho', className: 'bg-green-100 text-green-800' },
      export: { text: 'Xuất kho', className: 'bg-red-100 text-red-800' },
      adjust: { text: 'Điều chỉnh', className: 'bg-yellow-100 text-yellow-800' },
    };
    return map[type] || { text: type, className: 'bg-gray-100' };
  };

  if (loading && products.length === 0 && activeTab === 'stock') return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý kho</h1>
      </div>

      {/* Thống kê tổng quan */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-sm text-slate-500">Tổng sản phẩm</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-sm text-slate-500">Sắp hết hàng</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.lowStockCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-sm text-slate-500">Hết hàng</p>
            <p className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-sm text-slate-500">Tổng giá trị tồn kho</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.totalInventoryValue.toLocaleString('vi-VN')}đ
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 border-b border-slate-200 flex justify-between items-center">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('stock')}
            className={`pb-2 px-1 ${activeTab === 'stock' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
          >
            Tồn kho hiện tại
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-1 ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
          >
            Lịch sử giao dịch
          </button>
        </nav>
        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5" />
          Bộ lọc
        </button>
      </div>

      {/* Thanh tìm kiếm và filter (chỉ hiện khi tab stock) */}
      {activeTab === 'stock' && (
        <>
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <div className="flex-1 min-w-60">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm theo SKU, tên sản phẩm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>

          {showFilterPanel && (
            <div className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Bộ lọc nâng cao</h3>
                <button onClick={() => setShowFilterPanel(false)}>
                  <XMarkIcon className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={filters.brand}
                  onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="">Tất cả thương hiệu</option>
                  {brands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <select
                  value={filters.stockStatus}
                  onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="">Tất cả trạng thái tồn</option>
                  <option value="low">Sắp hết hàng</option>
                  <option value="out">Hết hàng</option>
                </select>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => setFilters({ category: '', brand: '', stockStatus: '' })}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Reset bộ lọc
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab tồn kho */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Sản phẩm</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Danh mục</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Thương hiệu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Giá</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tồn kho</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product);
                  return (
                    <tr key={product._id} className="hover:bg-blue-50/40 transition">
                      <td className="px-4 py-3 text-sm font-mono text-slate-500">{product.sku || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {product.images && product.images[0] && (
                            <img src={product.images[0]} alt={product.name} className="w-8 h-8 object-cover rounded" />
                          )}
                          <span className="text-sm font-medium text-slate-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{product.category?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{product.brand?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{product.price?.toLocaleString()}đ</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{product.stock}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setSelectedProduct(product); setShowImportModal(true); }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Nhập kho"
                          >
                            <ArrowUpTrayIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => { setSelectedProduct(product); setShowExportModal(true); }}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                            title="Xuất kho"
                          >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => { setSelectedProduct(product); setShowAdjustModal(true); }}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Điều chỉnh"
                          >
                            <AdjustmentsHorizontalIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && (
            <p className="text-center py-8 text-slate-500">Không có sản phẩm nào trong kho</p>
          )}
        </div>
      )}

      {/* Tab lịch sử giao dịch */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Sản phẩm</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Loại</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Số lượng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Ghi chú</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Liên quan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Người tạo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t) => {
                  const typeInfo = getTypeInfo(t.type);
                  const productName = typeof t.product_variant_id === 'object'
                    ? t.product_variant_id?.name || 'N/A'
                    : t.product_variant_id || 'N/A';
                  const productSku = typeof t.product_variant_id === 'object' ? t.product_variant_id?.sku : '';
                  return (
                    <tr key={t._id}>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        <div>{productName}</div>
                        {productSku && <div className="text-xs text-slate-400">{productSku}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${typeInfo.className}`}>
                          {typeInfo.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{Math.abs(t.quantity)}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{t.note || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {t.related_order ? <a href={`/admin/orders/${t.related_order}`} className="text-blue-600 hover:underline">Đơn #{t.related_order}</a> : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{t.created_by?.fullName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{new Date(t.created_at).toLocaleString('vi-VN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredTransactions.length === 0 && (
            <p className="text-center py-8 text-slate-500">Không có giao dịch nào</p>
          )}
        </div>
      )}

      {/* Modal nhập kho */}
      {showImportModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Nhập kho: {selectedProduct.name}</h3>
            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowImportModal(false); resetModal(); }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {actionLoading ? 'Đang xử lý...' : 'Nhập kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xuất kho */}
      {showExportModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-2">Xuất kho: {selectedProduct.name}</h3>
            <p className="text-sm text-slate-500 mb-4">Tồn hiện tại: {selectedProduct.stock}</p>
            <form onSubmit={handleExport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowExportModal(false); resetModal(); }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {actionLoading ? 'Đang xử lý...' : 'Xuất kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal điều chỉnh tồn kho */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-2">Điều chỉnh tồn kho: {selectedProduct.name}</h3>
            <p className="text-sm text-slate-500 mb-4">Tồn hiện tại: {selectedProduct.stock}</p>
            <form onSubmit={handleAdjust} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng mới</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
                <p className="text-xs text-slate-400 mt-1">Nhập số lượng mới (sẽ ghi nhận là điều chỉnh)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAdjustModal(false); resetModal(); }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-purple-300"
                >
                  {actionLoading ? 'Đang xử lý...' : 'Điều chỉnh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}